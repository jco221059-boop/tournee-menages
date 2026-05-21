-- ============================================================
-- Tournée Ménages - Migration initiale
-- ============================================================

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS workers (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name      TEXT NOT NULL,
  color     TEXT NOT NULL DEFAULT '#4F7EFF',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS properties (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                        TEXT NOT NULL,
  address                     TEXT NOT NULL,
  lat                         NUMERIC(10, 7),
  lng                         NUMERIC(10, 7),
  surface_m2                  INTEGER NOT NULL DEFAULT 50,
  bedrooms                    INTEGER NOT NULL DEFAULT 1,
  bathrooms                   INTEGER NOT NULL DEFAULT 1,
  base_cleaning_duration_min  INTEGER NOT NULL DEFAULT 90,
  notes                       TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  guest_name  TEXT NOT NULL,
  check_in    DATE NOT NULL,
  check_out   DATE NOT NULL,
  num_guests  INTEGER NOT NULL DEFAULT 2,
  platform    TEXT NOT NULL DEFAULT 'airbnb'
              CHECK (platform IN ('airbnb', 'booking', 'direct', 'other')),
  status      TEXT NOT NULL DEFAULT 'confirmed'
              CHECK (status IN ('pending', 'confirmed', 'cleaning_needed', 'cleaned', 'cancelled')),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_dates CHECK (check_out > check_in)
);

CREATE TABLE IF NOT EXISTS cleaning_jobs (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id        UUID REFERENCES reservations(id) ON DELETE SET NULL,
  property_id           UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  scheduled_date        DATE NOT NULL,
  priority              TEXT NOT NULL DEFAULT 'plannable'
                        CHECK (priority IN ('critical', 'very_urgent', 'urgent', 'plannable', 'flexible')),
  dirtiness             TEXT NOT NULL DEFAULT 'normal'
                        CHECK (dirtiness IN ('clean', 'normal', 'dirty')),
  adjusted_duration_min INTEGER NOT NULL DEFAULT 90,
  cleaning_window_start TIME,
  cleaning_window_end   TIME,
  assigned_worker_id    UUID REFERENCES workers(id) ON DELETE SET NULL,
  status                TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  notes                 TEXT,
  started_at            TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS routes_cache (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_property_id  UUID REFERENCES properties(id) ON DELETE CASCADE,
  to_property_id    UUID REFERENCES properties(id) ON DELETE CASCADE,
  duration_min      INTEGER NOT NULL,
  distance_km       NUMERIC(8, 2) NOT NULL,
  cached_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (from_property_id, to_property_id)
);

CREATE TABLE IF NOT EXISTS daily_plans (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date           DATE NOT NULL UNIQUE,
  status         TEXT NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft', 'validated', 'in_progress', 'completed')),
  total_jobs     INTEGER NOT NULL DEFAULT 0,
  completed_jobs INTEGER NOT NULL DEFAULT 0,
  car_trips      INTEGER NOT NULL DEFAULT 0,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plan_steps (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  daily_plan_id   UUID NOT NULL REFERENCES daily_plans(id) ON DELETE CASCADE,
  cleaning_job_id UUID REFERENCES cleaning_jobs(id) ON DELETE SET NULL,
  worker_id       UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  step_type       TEXT NOT NULL
                  CHECK (step_type IN ('travel', 'cleaning', 'break', 'pickup', 'dropoff')),
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  duration_min    INTEGER NOT NULL,
  order_index     INTEGER NOT NULL,
  notes           TEXT
);

CREATE TABLE IF NOT EXISTS alerts (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type           TEXT NOT NULL
                 CHECK (type IN ('conflict', 'missing_cleaning', 'overlap', 'tight_window')),
  severity       TEXT NOT NULL DEFAULT 'warning'
                 CHECK (severity IN ('error', 'warning', 'info')),
  message        TEXT NOT NULL,
  property_id    UUID REFERENCES properties(id) ON DELETE SET NULL,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  date           DATE,
  resolved       BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_reservations_property_id ON reservations(property_id);
CREATE INDEX IF NOT EXISTS idx_reservations_check_in ON reservations(check_in);
CREATE INDEX IF NOT EXISTS idx_reservations_check_out ON reservations(check_out);
CREATE INDEX IF NOT EXISTS idx_cleaning_jobs_property_id ON cleaning_jobs(property_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_jobs_scheduled_date ON cleaning_jobs(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_cleaning_jobs_status ON cleaning_jobs(status);
CREATE INDEX IF NOT EXISTS idx_plan_steps_daily_plan_id ON plan_steps(daily_plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_steps_worker_id ON plan_steps(worker_id);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts(resolved);

-- ============================================================
-- TRIGGERS updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION trigger_update_updated_at();

CREATE TRIGGER trg_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION trigger_update_updated_at();

CREATE TRIGGER trg_cleaning_jobs_updated_at
  BEFORE UPDATE ON cleaning_jobs
  FOR EACH ROW EXECUTE FUNCTION trigger_update_updated_at();

CREATE TRIGGER trg_daily_plans_updated_at
  BEFORE UPDATE ON daily_plans
  FOR EACH ROW EXECUTE FUNCTION trigger_update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Toutes opérations autorisées pour les utilisateurs authentifiés
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['workers','properties','reservations','cleaning_jobs','routes_cache','daily_plans','plan_steps','alerts','app_settings'] LOOP
    EXECUTE format(
      'CREATE POLICY "auth_all_%s" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      tbl, tbl
    );
  END LOOP;
END $$;

-- ============================================================
-- DONNÉES INITIALES
-- ============================================================

INSERT INTO workers (name, color) VALUES
  ('Jean-Claude', '#4F7EFF'),
  ('Madame',      '#A855F7')
ON CONFLICT DO NOTHING;

INSERT INTO app_settings (key, value) VALUES
  ('start_time',        '08:00'),
  ('end_time',          '18:00'),
  ('max_work_hours',    '6'),
  ('max_travel_hours',  '1'),
  ('min_break_hours',   '1'),
  ('checkout_time',     '11:00'),
  ('checkin_time',      '15:00'),
  ('home_address',      ''),
  ('home_lat',          ''),
  ('home_lng',          '')
ON CONFLICT (key) DO NOTHING;

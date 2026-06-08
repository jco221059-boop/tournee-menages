-- ============================================================
-- MIGRATION MENAGEFLOW — Workflow Carrousel
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

-- ── 1. requires_photo sur les étapes de workflow ─────────────
ALTER TABLE workflow_steps ADD COLUMN IF NOT EXISTS requires_photo boolean NOT NULL DEFAULT false;

-- ── 2. reference_photo_url sur les tâches ───────────────────
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reference_photo_url text;

-- ── 3. Photos finales par pièce (définies dans le workflow) ──
CREATE TABLE IF NOT EXISTS workflow_room_final_photos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id         UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  room_id             UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  label               TEXT NOT NULL,
  reference_photo_url TEXT NOT NULL,
  order_index         INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS wf_room_final_photos_wf_idx ON workflow_room_final_photos(workflow_id);
CREATE INDEX IF NOT EXISTS wf_room_final_photos_room_idx ON workflow_room_final_photos(room_id);

-- ── 4. Photos finales prises par le prestataire ──────────────
CREATE TABLE IF NOT EXISTS mission_room_final_photos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id     UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  room_id        UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  final_photo_id UUID REFERENCES workflow_room_final_photos(id) ON DELETE SET NULL,
  url            TEXT NOT NULL,
  taken_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS mission_room_final_photos_mission_idx ON mission_room_final_photos(mission_id);

-- ── 5. Progression par pièce ─────────────────────────────────
CREATE TABLE IF NOT EXISTS mission_room_progress (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id       UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  room_id          UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  tasks_completed  BOOLEAN NOT NULL DEFAULT false,
  photos_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at     TIMESTAMPTZ,
  UNIQUE(mission_id, room_id)
);
CREATE INDEX IF NOT EXISTS mission_room_progress_mission_idx ON mission_room_progress(mission_id);

-- ── 6. RLS ───────────────────────────────────────────────────
ALTER TABLE workflow_room_final_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_room_final_photos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_room_progress      ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tables TEXT[] := ARRAY['workflow_room_final_photos','mission_room_final_photos','mission_room_progress'];
  t TEXT;
  pol TEXT;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    pol := 'auth_full_' || t;
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol, t);
    EXECUTE format('CREATE POLICY %I ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', pol, t);
  END LOOP;
END $$;

-- ============================================================
-- FIN DE LA MIGRATION CAROUSEL
-- ============================================================

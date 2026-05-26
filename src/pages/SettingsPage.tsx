// PAGE: SettingsPage
// CHANGES: Ambiance "Lin naturel" — fond #FAF7F2, groupes de réglages en cards blanches.
// Avatar avec initiales en haut + badge rôle actif.
// Sélecteur de rôle inline déployable.
// Toggles vert sauge / beige selon état.
// Bouton déconnexion en rouge doux.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, type UserRole } from '../store/authStore'
import { Building2, Brush, ShieldCheck, Bell, Info, FileText, LogOut, ChevronDown, ChevronUp } from 'lucide-react'

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative flex-shrink-0 transition-colors"
      style={{
        width: 42, height: 24, borderRadius: 12,
        background: checked ? '#6B9E78' : '#EDE0D0',
      }}
    >
      <div
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
        style={{ transform: checked ? 'translateX(20px)' : 'translateX(2px)' }}
      />
    </button>
  )
}

function SettingsRow({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  right,
  onClick,
}: {
  icon: React.ElementType
  iconBg: string
  iconColor: string
  title: string
  subtitle?: string
  right?: React.ReactNode
  onClick?: () => void
}) {
  return (
    <div
      className="flex items-center gap-3.5 px-4 py-3.5 cursor-pointer"
      onClick={onClick}
      style={{ borderBottom: '1px solid #F5F0EA' }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: iconBg, color: iconColor }}>
        <Icon size={17} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: '#2C1F0E' }}>{title}</p>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: '#A8937A' }}>{subtitle}</p>
        )}
      </div>
      {right}
    </div>
  )
}

export default function SettingsPage() {
  const { user, role, setRole, signOut } = useAuthStore()
  const [showRoleSelector, setShowRoleSelector] = useState(false)
  const [trustMode, setTrustMode] = useState(true)
  const [notifications, setNotifications] = useState(false)
  const [savingRole, setSavingRole] = useState(false)

  const handleRoleChange = async (newRole: UserRole) => {
    setSavingRole(true)
    await setRole(newRole)
    setSavingRole(false)
    setShowRoleSelector(false)
  }

  // Initiales depuis l'email
  const initials = user?.email
    ? user.email.split('@')[0].slice(0, 2).toUpperCase()
    : 'ME'

  const roleLabel = role === 'admin' ? 'Conciergerie / Admin' : 'Prestataire ménage'
  const roleBg = role === 'admin' ? '#CCFBF1' : '#DCFCE7'
  const roleColor = role === 'admin' ? '#0F766E' : '#166534'

  return (
    <div className="flex flex-col h-full" style={{ background: '#FAF7F2' }}>

      {/* Header */}
      <div className="px-5 pt-14 pb-6 flex-shrink-0">
        <h1 className="text-3xl font-bold" style={{ color: '#2C1F0E', letterSpacing: '-0.025em' }}>
          Réglages
        </h1>
      </div>

      <div className="scroll-area px-5 pb-8">

        {/* Bloc utilisateur */}
        <div className="flex items-center gap-3.5 p-4 rounded-2xl mb-6"
          style={{ background: '#fff', border: '1px solid #EDE0D0' }}>
          <div className="w-13 h-13 rounded-2xl flex items-center justify-center text-base font-bold flex-shrink-0"
            style={{ background: '#CCFBF1', color: '#0F766E', width: 52, height: 52, borderRadius: 16 }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: '#2C1F0E' }}>
              {user?.email?.split('@')[0] ?? 'Utilisateur'}
            </p>
            <p className="text-xs mt-0.5 truncate" style={{ color: '#A8937A' }}>
              {user?.email ?? ''}
            </p>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
            style={{ background: roleBg, color: roleColor }}>
            {role === 'admin' ? 'Admin' : 'Prestataire'}
          </span>
        </div>

        {/* Profil */}
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5 pl-0.5"
          style={{ color: '#C4A882' }}>
          Profil
        </p>
        <div className="rounded-2xl overflow-hidden mb-6"
          style={{ background: '#fff', border: '1px solid #EDE0D0' }}>

          <div
            className="flex items-center gap-3.5 px-4 py-3.5 cursor-pointer"
            onClick={() => setShowRoleSelector(v => !v)}
            style={{ borderBottom: showRoleSelector ? '1px solid #F5F0EA' : 'none' }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#CCFBF1', color: '#0D9488' }}>
              <Building2 size={17} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: '#2C1F0E' }}>Rôle actif</p>
              <p className="text-xs mt-0.5" style={{ color: '#A8937A' }}>{roleLabel}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold" style={{ color: '#A8937A' }}>Changer</span>
              {showRoleSelector
                ? <ChevronUp size={16} style={{ color: '#D5C4AF' }} />
                : <ChevronDown size={16} style={{ color: '#D5C4AF' }} />}
            </div>
          </div>

          {/* Sélecteur inline */}
          {showRoleSelector && (
            <div className="flex gap-2 px-4 pb-4 pt-2">
              {/* Admin */}
              <button
                onClick={() => handleRoleChange('admin')}
                disabled={savingRole}
                className="flex-1 rounded-2xl p-3 text-center transition-all"
                style={{
                  border: `1.5px solid ${role === 'admin' ? '#0D9488' : '#EDE0D0'}`,
                  background: role === 'admin' ? '#F0FDFB' : '#FAF7F2',
                }}
              >
                <div className="flex justify-center mb-1.5">
                  <Building2 size={20} style={{ color: role === 'admin' ? '#0D9488' : '#C4A882' }} />
                </div>
                <span className="text-xs font-bold"
                  style={{ color: role === 'admin' ? '#0F766E' : '#A8937A' }}>
                  Admin
                </span>
              </button>

              {/* Prestataire */}
              <button
                onClick={() => handleRoleChange('cleaner')}
                disabled={savingRole}
                className="flex-1 rounded-2xl p-3 text-center transition-all"
                style={{
                  border: `1.5px solid ${role === 'cleaner' ? '#6B9E78' : '#EDE0D0'}`,
                  background: role === 'cleaner' ? '#F0FDF4' : '#FAF7F2',
                }}
              >
                <div className="flex justify-center mb-1.5">
                  <Brush size={20} style={{ color: role === 'cleaner' ? '#6B9E78' : '#C4A882' }} />
                </div>
                <span className="text-xs font-bold"
                  style={{ color: role === 'cleaner' ? '#2C4A30' : '#A8937A' }}>
                  Prestataire
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Préférences */}
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5 pl-0.5"
          style={{ color: '#C4A882' }}>
          Préférences
        </p>
        <div className="rounded-2xl overflow-hidden mb-6"
          style={{ background: '#fff', border: '1px solid #EDE0D0' }}>
          <SettingsRow
            icon={ShieldCheck}
            iconBg="#DCFCE7"
            iconColor="#6B9E78"
            title="Mode confiance"
            subtitle="Activé par défaut au démarrage"
            right={<Toggle checked={trustMode} onChange={setTrustMode} />}
          />
          <div style={{ borderBottom: 'none' }}>
            <SettingsRow
              icon={Bell}
              iconBg="#FEF3C7"
              iconColor="#D97706"
              title="Notifications"
              subtitle="Rappels avant check-in"
              right={<Toggle checked={notifications} onChange={setNotifications} />}
            />
          </div>
        </div>

        {/* Application */}
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5 pl-0.5"
          style={{ color: '#C4A882' }}>
          Application
        </p>
        <div className="rounded-2xl overflow-hidden mb-6"
          style={{ background: '#fff', border: '1px solid #EDE0D0' }}>
          <SettingsRow
            icon={Info}
            iconBg="#F5F0EA"
            iconColor="#A8937A"
            title="Version"
            right={<span className="text-xs font-semibold" style={{ color: '#A8937A' }}>v1.0.0</span>}
          />
          <div style={{ borderBottom: 'none' }}>
            <SettingsRow
              icon={FileText}
              iconBg="#F5F0EA"
              iconColor="#A8937A"
              title="Conditions d'utilisation"
              right={
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                  style={{ color: '#D5C4AF' }}>
                  <path d="M5.5 3.5L10.5 8l-5 4.5" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
            />
          </div>
        </div>

        {/* Déconnexion */}
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold transition-opacity"
          style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#DC2626',
          }}
        >
          <LogOut size={17} />
          Se déconnecter
        </button>

      </div>
    </div>
  )
}

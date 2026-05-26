import { NavLink, useLocation } from 'react-router-dom'
import { Home, Settings, Wrench } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const TABS_ADMIN = [
  { to: '/missions', icon: Home, label: 'Missions' },
  { to: '/config',   icon: Wrench, label: 'Config' },
  { to: '/settings', icon: Settings, label: 'Réglages' },
]

const TABS_CLEANER = [
  { to: '/missions', icon: Home, label: 'Missions' },
  { to: '/settings', icon: Settings, label: 'Réglages' },
]

export function BottomNav() {
  const location = useLocation()
  const { role } = useAuthStore()
  const tabs = role === 'admin' ? TABS_ADMIN : TABS_CLEANER

  return (
    <nav
      className="flex-shrink-0"
      style={{
        background: '#fff',
        borderTop: '1px solid #EDE0D0',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-stretch" style={{ height: 60 }}>
        {tabs.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname.startsWith(to)
          return (
            <NavLink
              key={to}
              to={to}
              className="flex flex-col items-center justify-center flex-1 gap-0.5 relative"
              style={{ color: isActive ? '#6B9E78' : '#C4A882' }}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.75}
              />
              <span className="text-[10px] font-semibold leading-none">
                {label}
              </span>
              {isActive && (
                <span
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ background: '#6B9E78' }}
                />
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

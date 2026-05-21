import { NavLink, useLocation } from 'react-router-dom'
import { Home, Calendar, Navigation, Bell, Settings } from 'lucide-react'
import clsx from 'clsx'
import { useAppStore } from '../../store/appStore'

const tabs = [
  { to: '/today', icon: Home, label: "Aujourd'hui" },
  { to: '/planning', icon: Calendar, label: 'Planning' },
  { to: '/field', icon: Navigation, label: 'Terrain' },
  { to: '/alerts', icon: Bell, label: 'Alertes' },
  { to: '/settings', icon: Settings, label: 'Paramètres' },
]

export function BottomNav() {
  const location = useLocation()
  const alerts = useAppStore((s) => s.alerts)
  const unreadAlerts = alerts.filter((a) => !a.resolved).length

  return (
    <nav className="bottom-nav bg-surface border-t border-border flex-shrink-0">
      <div className="flex items-stretch h-16">
        {tabs.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname.startsWith(to)
          const isAlerts = to === '/alerts'
          return (
            <NavLink
              key={to}
              to={to}
              className={clsx(
                'flex flex-col items-center justify-center flex-1 gap-0.5 relative touch-target transition-colors',
                isActive ? 'text-primary' : 'text-text-secondary'
              )}
            >
              <div className="relative">
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.75}
                  className={clsx(isActive ? 'text-primary' : 'text-text-secondary')}
                />
                {isAlerts && unreadAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 bg-danger text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
                    {unreadAlerts > 9 ? '9+' : unreadAlerts}
                  </span>
                )}
              </div>
              <span
                className={clsx(
                  'text-[10px] font-medium leading-none',
                  isActive ? 'text-primary' : 'text-text-muted'
                )}
              >
                {label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

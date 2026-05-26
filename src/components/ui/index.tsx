import { forwardRef, useState, useCallback } from 'react'
import clsx from 'clsx'
import type { Priority, AlertSeverity } from '../../types'
import { priorityLabel } from '../../lib/optimizer'

// ─── Button ─────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, children, className, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all active:scale-95 touch-target disabled:opacity-50 disabled:pointer-events-none'
    const variants = {
      primary: 'bg-primary hover:bg-primary-hover text-white shadow-glow',
      secondary: 'bg-surface-3 hover:bg-surface-2 text-text-primary border border-border',
      danger: 'bg-danger/20 hover:bg-danger/30 text-danger border border-danger/30',
      ghost: 'hover:bg-surface-2 text-text-secondary',
      success: 'bg-success/20 hover:bg-success/30 text-success border border-success/30',
    }
    const sizes = {
      sm: 'text-sm px-3 py-1.5 h-8',
      md: 'text-sm px-4 py-2.5 h-11',
      lg: 'text-base px-6 py-3 h-13',
    }
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : icon}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

// ─── Card ────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  pressable?: boolean
}

export function Card({ children, className, style, onClick, pressable }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={clsx(
        'bg-surface rounded-2xl p-4 shadow-card border border-border',
        pressable && 'cursor-pointer active:scale-[0.98] transition-transform',
        className
      )}
    >
      {children}
    </div>
  )
}

// ─── Input ───────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-text-secondary">{label}</label>
      )}
      <input
        ref={ref}
        className={clsx(
          'bg-surface-2 border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors h-11',
          error ? 'border-danger/50' : 'border-border',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      {helperText && !error && <p className="text-xs text-text-muted">{helperText}</p>}
    </div>
  )
)
Input.displayName = 'Input'

// ─── Select ──────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-text-secondary">{label}</label>
      )}
      <select
        ref={ref}
        className={clsx(
          'bg-surface-2 border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors h-11 appearance-none',
          error ? 'border-danger/50' : 'border-border',
          className
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-surface-2">
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
)
Select.displayName = 'Select'

// ─── Textarea ────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-text-secondary">{label}</label>}
      <textarea
        ref={ref}
        className={clsx(
          'bg-surface-2 border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none',
          error ? 'border-danger/50' : 'border-border',
          className
        )}
        rows={3}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
)
Textarea.displayName = 'Textarea'

// ─── Badge ───────────────────────────────────────────────────

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | Priority | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md'
}

export function Badge({ children, variant = 'default', size = 'sm' }: BadgeProps) {
  const base = 'inline-flex items-center rounded-full font-semibold'
  const sizes = { sm: 'text-[10px] px-2 py-0.5', md: 'text-xs px-2.5 py-1' }
  const variants: Record<string, string> = {
    default: 'bg-surface-3 text-text-secondary',
    critical: 'bg-danger/20 text-danger border border-danger/30',
    very_urgent: 'bg-warning/20 text-warning border border-warning/30',
    urgent: 'bg-primary/20 text-primary border border-primary/30',
    plannable: 'bg-success/20 text-success border border-success/30',
    flexible: 'bg-surface-3 text-text-secondary border border-border',
    success: 'bg-success/20 text-success border border-success/30',
    warning: 'bg-warning/20 text-warning border border-warning/30',
    danger: 'bg-danger/20 text-danger border border-danger/30',
  }
  return (
    <span className={clsx(base, sizes[size], variants[variant] || variants.default)}>
      {children}
    </span>
  )
}

// ─── PriorityBadge ───────────────────────────────────────────

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge variant={priority}>{priorityLabel(priority)}</Badge>
}

// ─── SeverityBadge ───────────────────────────────────────────

export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  const labels = { error: 'Erreur', warning: 'Avertissement', info: 'Info' }
  const v = severity === 'error' ? 'danger' : severity === 'warning' ? 'warning' : 'default'
  return <Badge variant={v as any}>{labels[severity]}</Badge>
}

// ─── Spinner ─────────────────────────────────────────────────

export function Spinner({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={clsx('animate-spin text-primary', className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

// ─── PageHeader ──────────────────────────────────────────────

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  back?: boolean
  onBack?: () => void
}

export function PageHeader({ title, subtitle, action, back, onBack }: PageHeaderProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-4 bg-bg border-b border-border flex-shrink-0">
      {back && (
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-2 text-text-secondary hover:text-text-primary transition-colors flex-shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-bold text-text-primary truncate">{title}</h1>
        {subtitle && <p className="text-xs text-text-secondary">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

// ─── EmptyState ──────────────────────────────────────────────

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description?: string
  subtitle?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center mb-4 text-text-muted">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-1">{title}</h3>
      {(description || subtitle) && <p className="text-sm text-text-secondary mb-4">{description || subtitle}</p>}
      {action}
    </div>
  )
}

// ─── StatCard ────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  color?: 'primary' | 'success' | 'warning' | 'danger'
  sub?: string
}

export function StatCard({ label, value, icon, color = 'primary', sub }: StatCardProps) {
  const colorClasses = {
    primary: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    danger: 'text-danger bg-danger/10',
  }
  return (
    <div className="bg-surface rounded-2xl p-4 border border-border">
      {icon && (
        <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center mb-3', colorClasses[color])}>
          {icon}
        </div>
      )}
      <div className="text-2xl font-bold text-text-primary">{value}</div>
      <div className="text-xs text-text-secondary mt-0.5">{label}</div>
      {sub && <div className="text-xs text-text-muted mt-0.5">{sub}</div>}
    </div>
  )
}

// ─── Toggle ──────────────────────────────────────────────────

interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative w-11 h-6 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-surface-3'
        )}
      >
        <div
          className={clsx(
            'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
            checked && 'translate-x-5'
          )}
        />
      </div>
      {label && <span className="text-sm text-text-primary">{label}</span>}
    </label>
  )
}

// ─── BottomSheet ─────────────────────────────────────────────

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  if (!open) return null
  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(44,31,14,0.35)' }}
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl flex flex-col"
        style={{
          background: '#FAF7F2',
          maxHeight: '90vh',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1.5 rounded-full" style={{ background: '#EDE0D0' }} />
        </div>
        {/* Titre */}
        {title && (
          <div className="px-5 pb-4 flex-shrink-0">
            <h3 className="text-base font-bold" style={{ color: '#2C1F0E', letterSpacing: '-0.01em' }}>
              {title}
            </h3>
          </div>
        )}
        {/* Contenu scrollable */}
        <div className="overflow-y-auto px-5 pb-5" style={{ scrollbarWidth: 'none' }}>
          {children}
        </div>
      </div>
    </>
  )
}

// ─── Toast ───────────────────────────────────────────────────

interface ToastProps {
  message?: string
  visible?: boolean
  show?: boolean
  variant?: string
}

export function Toast({ message = 'Enregistré ✓', visible, show }: ToastProps) {
  if (!visible && !show) return null
  return (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-bold text-white shadow-lg"
      style={{ background: '#2C1F0E' }}
    >
      {message}
    </div>
  )
}

// ─── useToast ────────────────────────────────────────────────


export function useToast(duration = 2000) {
  const [visible, setVisible] = useState(false)

  const trigger = useCallback(() => {
    setVisible(true)
    setTimeout(() => setVisible(false), duration)
  }, [duration])

  return { visible, show: visible, trigger }
}

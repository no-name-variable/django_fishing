/**
 * Прогресс бар
 */
import { clsx } from 'clsx'

interface ProgressBarProps {
  value: number
  max: number
  label?: string
  showValue?: boolean
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'green' | 'yellow' | 'red' | 'blue'
  className?: string
}

export default function ProgressBar({
  value,
  max,
  label,
  showValue = true,
  size = 'md',
  color = 'primary',
  className,
}: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }

  const colorClasses = {
    primary: 'bg-primary-500',
    green: 'bg-accent-green',
    yellow: 'bg-accent-gold',
    red: 'bg-accent-red',
    blue: 'bg-accent-blue',
  }

  return (
    <div className={clsx('w-full', className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm text-gray-400">{label}</span>}
          {showValue && (
            <span className="text-sm text-gray-300">
              {value}/{max}
            </span>
          )}
        </div>
      )}
      <div
        className={clsx(
          'w-full rounded-full overflow-hidden',
          'bg-water-abyss/50',
          sizeClasses[size]
        )}
      >
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-500',
            colorClasses[color]
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

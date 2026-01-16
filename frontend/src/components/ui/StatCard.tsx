/**
 * Карточка статистики
 */
import { clsx } from 'clsx'
import { ReactNode } from 'react'

interface StatCardProps {
  icon: ReactNode
  label: string
  value: string | number
  subValue?: string
  color?: 'default' | 'gold' | 'green' | 'blue' | 'red'
  className?: string
}

export default function StatCard({
  icon,
  label,
  value,
  subValue,
  color = 'default',
  className,
}: StatCardProps) {
  const colorClasses = {
    default: 'from-water-dark/80 to-water-deeper/80 border-water/20',
    gold: 'from-amber-900/30 to-amber-950/30 border-amber-500/20',
    green: 'from-green-900/30 to-green-950/30 border-green-500/20',
    blue: 'from-blue-900/30 to-blue-950/30 border-blue-500/20',
    red: 'from-red-900/30 to-red-950/30 border-red-500/20',
  }

  const iconColorClasses = {
    default: 'text-water-light',
    gold: 'text-amber-400',
    green: 'text-green-400',
    blue: 'text-blue-400',
    red: 'text-red-400',
  }

  return (
    <div
      className={clsx(
        'rounded-xl p-4',
        'bg-gradient-to-br border',
        'backdrop-blur-sm',
        colorClasses[color],
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className={clsx('text-2xl', iconColorClasses[color])}>{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-2xl font-bold text-white">{value}</div>
          <div className="text-xs text-gray-400 truncate">{label}</div>
          {subValue && (
            <div className="text-xs text-gray-500 mt-0.5">{subValue}</div>
          )}
        </div>
      </div>
    </div>
  )
}

// Маленькая карточка для редкости
export function RarityCard({
  count,
  label,
  color,
}: {
  count: number
  label: string
  color: string
}) {
  return (
    <div
      className={clsx(
        'rounded-lg p-3 text-center',
        'bg-gradient-to-br from-water-dark/60 to-water-deeper/60',
        'border border-water/10'
      )}
    >
      <div className="text-xl font-bold" style={{ color }}>
        {count}
      </div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  )
}

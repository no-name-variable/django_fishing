/**
 * Базовый компонент карточки
 */
import { ReactNode } from 'react'
import { clsx } from 'clsx'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  glow?: boolean
  onClick?: () => void
}

export default function Card({
  children,
  className,
  hover = false,
  glow = false,
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        // Базовые стили
        'rounded-xl p-4',
        'bg-gradient-card backdrop-blur-sm',
        'border border-card-border',
        'shadow-card',
        // Hover эффекты
        hover && 'cursor-pointer transition-all duration-300 hover:shadow-card-hover hover:border-water/50',
        // Glow эффект
        glow && 'shadow-glow animate-glow-pulse',
        className
      )}
    >
      {children}
    </div>
  )
}

// Заголовок карточки
export function CardHeader({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={clsx('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  )
}

// Заголовок секции
export function CardTitle({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <h3 className={clsx('text-lg font-semibold text-white', className)}>
      {children}
    </h3>
  )
}

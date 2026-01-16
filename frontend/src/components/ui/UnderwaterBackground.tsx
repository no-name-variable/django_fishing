/**
 * Подводный фон с анимированными пузырьками
 */
import { useMemo } from 'react'

interface Bubble {
  id: number
  left: number
  size: number
  delay: number
  duration: number
  opacity: number
}

export default function UnderwaterBackground() {
  // Генерируем пузырьки один раз
  const bubbles = useMemo<Bubble[]>(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 4 + Math.random() * 12,
      delay: Math.random() * 8,
      duration: 8 + Math.random() * 8,
      opacity: 0.1 + Math.random() * 0.3,
    }))
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Градиентный фон */}
      <div className="absolute inset-0 bg-gradient-underwater" />

      {/* Световое пятно сверху */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px]"
        style={{
          background:
            'radial-gradient(ellipse at center top, rgba(98, 182, 203, 0.15) 0%, transparent 70%)',
        }}
      />

      {/* Пузырьки */}
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="absolute rounded-full bg-white/20 backdrop-blur-xs"
          style={{
            left: `${bubble.left}%`,
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            opacity: bubble.opacity,
            animation: `bubble ${bubble.duration}s ease-in-out ${bubble.delay}s infinite`,
          }}
        />
      ))}

      {/* Блики на воде */}
      <div className="absolute inset-0">
        <div
          className="absolute top-20 left-[10%] w-32 h-32 rounded-full opacity-5"
          style={{
            background:
              'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute top-40 right-[20%] w-24 h-24 rounded-full opacity-5"
          style={{
            background:
              'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
          }}
        />
      </div>
    </div>
  )
}

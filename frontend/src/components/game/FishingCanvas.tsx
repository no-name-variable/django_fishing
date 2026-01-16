/**
 * Основной игровой Canvas с анимацией воды
 */
import { useRef, useEffect } from 'react'
import type { FightState } from '../../types'

interface Props {
  fishing: {
    gameState: string
    castDistance: number
    castDepth: number
    fightState: FightState | null
    hookedFish: { name: string; weight: number } | null
  }
}

export default function FishingCanvas({ fishing }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Установка размеров
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)

    let time = 0

    const draw = () => {
      const width = canvas.offsetWidth
      const height = canvas.offsetHeight

      // Очистка
      ctx.clearRect(0, 0, width, height)

      // Фон - градиент воды
      const gradient = ctx.createLinearGradient(0, 0, 0, height)
      gradient.addColorStop(0, '#a8d8ea')
      gradient.addColorStop(0.3, '#62b6cb')
      gradient.addColorStop(1, '#1b4965')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)

      // Волны
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 2

      for (let i = 0; i < 5; i++) {
        ctx.beginPath()
        const y = 50 + i * 40
        for (let x = 0; x < width; x += 5) {
          const wave = Math.sin((x + time * 50 + i * 30) * 0.02) * 5
          if (x === 0) {
            ctx.moveTo(x, y + wave)
          } else {
            ctx.lineTo(x, y + wave)
          }
        }
        ctx.stroke()
      }

      // Удочка (если не idle)
      if (fishing.gameState !== 'idle') {
        drawRod(ctx, width, height, time)
      }

      // Леска и поплавок (если заброшено)
      if (['waiting', 'bite', 'fighting'].includes(fishing.gameState)) {
        drawLine(ctx, width, height, fishing, time)
      }

      // Рыба при вываживании
      if (fishing.gameState === 'fighting' && fishing.fightState) {
        drawFish(ctx, width, height, fishing.fightState, time)
      }

      time += 0.016 // ~60fps
      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [fishing.gameState, fishing.fightState])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-[400px] rounded-xl"
      style={{ background: '#1b4965' }}
    />
  )
}

// Рисование удочки
function drawRod(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number
) {
  ctx.save()
  ctx.translate(50, height - 50)

  // Изгиб удилища
  const flex = Math.sin(time * 2) * 3

  ctx.strokeStyle = '#8b4513'
  ctx.lineWidth = 4
  ctx.lineCap = 'round'

  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.quadraticCurveTo(80, -100 + flex, 150, -180 + flex * 2)
  ctx.stroke()

  // Катушка
  ctx.fillStyle = '#333'
  ctx.beginPath()
  ctx.arc(20, -20, 15, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

// Рисование лески и поплавка
function drawLine(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  fishing: Props['fishing'],
  time: number
) {
  const rodTipX = 200
  const rodTipY = height - 230

  // Позиция поплавка зависит от дистанции
  const floatX = Math.min(width * 0.7, 200 + fishing.castDistance * 3)
  const floatY = 80 + Math.sin(time * 3) * 3

  // Леска
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(rodTipX, rodTipY)
  ctx.quadraticCurveTo(floatX * 0.5, rodTipY - 50, floatX, floatY)
  ctx.stroke()

  // Поплавок
  ctx.fillStyle = '#ff6b6b'
  ctx.beginPath()
  ctx.ellipse(floatX, floatY, 8, 15, 0, 0, Math.PI * 2)
  ctx.fill()

  // Белая полоса на поплавке
  ctx.fillStyle = 'white'
  ctx.beginPath()
  ctx.ellipse(floatX, floatY - 5, 6, 3, 0, 0, Math.PI * 2)
  ctx.fill()

  // При поклёвке поплавок дёргается
  if (fishing.gameState === 'bite') {
    ctx.fillStyle = 'rgba(255, 107, 107, 0.5)'
    ctx.beginPath()
    ctx.arc(floatX, floatY, 20 + Math.sin(time * 20) * 5, 0, Math.PI * 2)
    ctx.fill()
  }
}

// Рисование рыбы
function drawFish(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  fightState: FightState,
  time: number
) {
  // Позиция рыбы зависит от дистанции и направления
  const centerX = width * 0.5
  const centerY = height * 0.6

  const distanceFactor = fightState.fishDistance / 50 // Нормализация
  const angle = (fightState.fishDirection * Math.PI) / 180

  const fishX = centerX + Math.cos(angle) * distanceFactor * 100
  const fishY = centerY + Math.sin(angle) * distanceFactor * 50

  ctx.save()
  ctx.translate(fishX, fishY)
  ctx.rotate(angle + Math.PI)

  // Цвет зависит от состояния
  const stateColors: Record<string, string> = {
    passive: '#4ade80',
    active: '#facc15',
    rush: '#ef4444',
    exhausted: '#94a3b8',
  }
  ctx.fillStyle = stateColors[fightState.fishState] || '#4ade80'

  // Тело рыбы
  const wiggle = Math.sin(time * 10) * 3
  ctx.beginPath()
  ctx.ellipse(0, wiggle, 30, 15, 0, 0, Math.PI * 2)
  ctx.fill()

  // Хвост
  ctx.beginPath()
  ctx.moveTo(30, wiggle)
  ctx.lineTo(50, -15 + wiggle)
  ctx.lineTo(50, 15 + wiggle)
  ctx.closePath()
  ctx.fill()

  // Глаз
  ctx.fillStyle = 'white'
  ctx.beginPath()
  ctx.arc(-15, -3 + wiggle, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'black'
  ctx.beginPath()
  ctx.arc(-15, -3 + wiggle, 2, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

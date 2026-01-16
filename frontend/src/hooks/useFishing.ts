/**
 * Хук для управления рыбалкой
 */
import { useState, useCallback, useEffect } from 'react'
import { useWebSocket } from './useWebSocket'
import { useGameStore } from '../store/gameStore'
import { useInventoryStore } from '../store/inventoryStore'

export function useFishing() {
  const ws = useWebSocket()
  const { gameState, fightState, hookedFish, currentLocation, error, lastCatchResult } =
    useGameStore()
  const { equipment } = useInventoryStore()

  const [castPower, setCastPower] = useState(0.5)
  const [castAngle, setCastAngle] = useState(45)
  const [isReeling, setIsReeling] = useState(false)

  // Проверка готовности к рыбалке
  const canFish = ws.isConnected && equipment?.isComplete && currentLocation

  // Присоединиться к локации
  const joinLocation = useCallback(
    (locationId: number) => {
      ws.joinLocation(locationId)
    },
    [ws]
  )

  // Забросить удочку
  const cast = useCallback(() => {
    if (gameState !== 'idle') return
    ws.cast(castPower, castAngle)
  }, [ws, gameState, castPower, castAngle])

  // Подсечка
  const hook = useCallback(() => {
    if (gameState !== 'bite') return
    ws.hook()
  }, [ws, gameState])

  // Подмотка (нужно удерживать)
  const startReeling = useCallback(
    (speed = 0.5) => {
      if (gameState !== 'fighting') return
      setIsReeling(true)
      ws.reel(speed)
    },
    [ws, gameState]
  )

  const stopReeling = useCallback(() => {
    setIsReeling(false)
  }, [])

  // Отпустить леску
  const release = useCallback(() => {
    if (gameState !== 'fighting') return
    ws.release()
  }, [ws, gameState])

  // Установить фрикцион
  const setDrag = useCallback(
    (level: number) => {
      if (gameState !== 'fighting') return
      ws.setDrag(level)
    },
    [ws, gameState]
  )

  // Удерживать
  const hold = useCallback(() => {
    if (gameState !== 'fighting') return
    ws.hold()
  }, [ws, gameState])

  // Цикл подмотки
  useEffect(() => {
    if (!isReeling || gameState !== 'fighting') return

    const interval = setInterval(() => {
      ws.reel(0.5)
    }, 100) // 10 раз в секунду

    return () => clearInterval(interval)
  }, [isReeling, gameState, ws])

  return {
    // Состояние
    gameState,
    fightState,
    hookedFish,
    currentLocation,
    error,
    lastCatchResult,
    canFish,
    isReeling,

    // Параметры заброса
    castPower,
    setCastPower,
    castAngle,
    setCastAngle,

    // Действия
    joinLocation,
    cast,
    hook,
    startReeling,
    stopReeling,
    release,
    setDrag,
    hold,
  }
}

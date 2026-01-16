/**
 * Хук для WebSocket соединения с игровым сервером
 */
import { useEffect, useRef, useCallback } from 'react'
import { useGameStore } from '../store/gameStore'
import { useUserStore } from '../store/userStore'
import type { FightState } from '../types'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws'

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<number>()

  const {
    setConnected,
    setLocation,
    setCastResult,
    setBite,
    setFightStarted,
    updateFightState,
    setCatchResult,
    setError,
    setGameState,
  } = useGameStore()

  const { updateMoney, addExperience } = useUserStore()

  // Подключение к WebSocket
  const connect = useCallback(() => {
    const token = localStorage.getItem('access_token')
    if (!token) return

    const ws = new WebSocket(`${WS_URL}/game/?token=${token}`)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('WebSocket подключен')
      setConnected(true)
      setError(null)
    }

    ws.onclose = () => {
      console.log('WebSocket отключен')
      setConnected(false)
      // Переподключение через 3 секунды
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connect()
      }, 3000)
    }

    ws.onerror = (error) => {
      console.error('WebSocket ошибка:', error)
      setError('Ошибка соединения с сервером')
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        handleMessage(data)
      } catch (e) {
        console.error('Ошибка парсинга сообщения:', e)
      }
    }
  }, [setConnected, setError])

  // Обработка входящих сообщений
  const handleMessage = useCallback(
    (data: Record<string, unknown>) => {
      switch (data.type) {
        case 'connected':
          console.log(data.message)
          break

        case 'joined': {
          console.log('Присоединились к локации:', data.session)
          const session = data.session as { location_id: number; location_name?: string }
          // Устанавливаем локацию из ответа сервера
          setLocation({
            id: session.location_id,
            name: session.location_name || 'Локация',
            description: '',
            image: null,
            maxDepth: 0,
            requiredLevel: 1,
          })
          setGameState('idle')
          break
        }

        case 'cast_result':
          setCastResult(data.distance as number, data.depth as number)
          break

        case 'bite':
          setBite(data.fish as string, data.intensity as number)
          break

        case 'fight_started':
          setFightStarted(data.fish as string, data.weight as number)
          break

        case 'fight_update': {
          // Конвертируем snake_case в camelCase
          const rawState = data.state as Record<string, unknown>
          updateFightState({
            fishState: rawState.fish_state as FightState['fishState'],
            fishStamina: rawState.fish_stamina as number,
            fishDistance: rawState.fish_distance as number,
            fishDirection: rawState.fish_direction as number,
            lineTension: rawState.line_tension as number,
            lineHealth: rawState.line_health as number,
            dragLevel: rawState.drag_level as number,
            isCritical: rawState.is_critical as boolean,
          })
          break
        }

        case 'catch': {
          const result = data.result as Record<string, unknown>
          setCatchResult({
            success: result.success as boolean,
            fishName: result.fish_name as string,
            weight: result.weight as number,
            price: result.price as number,
            experience: result.experience as number,
            leveledUp: result.leveled_up as boolean,
            newLevel: result.new_level as number,
            achievements: result.achievements as string[],
            reason: result.reason as string,
          })

          // Обновляем локальное состояние пользователя
          if (result.success) {
            updateMoney(result.price as number)
            addExperience(result.experience as number)
          }
          break
        }

        case 'error':
          console.error('Ошибка от сервера:', data.message)
          setError(data.message as string)
          break

        default:
          console.log('Неизвестное сообщение:', data)
      }
    },
    [
      setLocation,
      setCastResult,
      setBite,
      setFightStarted,
      updateFightState,
      setCatchResult,
      setError,
      setGameState,
      updateMoney,
      addExperience,
    ]
  )

  // Отправка сообщения
  const send = useCallback((type: string, data: Record<string, unknown> = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, ...data }))
    } else {
      console.error('WebSocket не подключен')
    }
  }, [])

  // Игровые действия
  const joinLocation = useCallback(
    (locationId: number) => {
      send('join', { location_id: locationId })
    },
    [send]
  )

  const cast = useCallback(
    (power: number, angle: number) => {
      send('cast', { power, angle })
    },
    [send]
  )

  const hook = useCallback(() => {
    send('hook')
  }, [send])

  const reel = useCallback(
    (speed: number) => {
      send('reel', { speed })
    },
    [send]
  )

  const release = useCallback(() => {
    send('release')
  }, [send])

  const setDrag = useCallback(
    (level: number) => {
      send('set_drag', { level })
    },
    [send]
  )

  const hold = useCallback(() => {
    send('hold')
  }, [send])

  // Подключаемся при монтировании
  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      wsRef.current?.close()
    }
  }, [connect])

  return {
    isConnected: useGameStore((s) => s.isConnected),
    joinLocation,
    cast,
    hook,
    reel,
    release,
    setDrag,
    hold,
  }
}

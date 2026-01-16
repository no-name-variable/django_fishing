/**
 * UI панель вываживания
 */
import { clsx } from 'clsx'
import type { FightState } from '../../types'

interface Props {
  fightState: FightState
  onReel: (speed: number) => void
  onRelease: () => void
  onDragChange: (level: number) => void
  isReeling: boolean
}

export default function FightMeter({
  fightState,
  onReel,
  onRelease,
  onDragChange,
  isReeling,
}: Props) {
  // Цвета состояний рыбы
  const fishStateColors: Record<string, string> = {
    passive: 'bg-green-500',
    active: 'bg-yellow-500',
    rush: 'bg-red-500',
    exhausted: 'bg-gray-500',
  }

  // Текст состояний
  const fishStateText: Record<string, string> = {
    passive: 'Пассивная - Подматывай!',
    active: 'Активная - Держи!',
    rush: 'РЫВОК - Отпусти!',
    exhausted: 'Уставшая - Вытягивай!',
  }

  return (
    <div className="absolute inset-x-0 bottom-4 px-4">
      <div className="card bg-water-dark/90 backdrop-blur-md">
        {/* Состояние рыбы */}
        <div
          className={clsx(
            'text-center py-2 rounded-lg mb-4 font-bold',
            fishStateColors[fightState.fishState],
            fightState.fishState === 'rush' && 'animate-pulse'
          )}
        >
          {fishStateText[fightState.fishState]}
        </div>

        {/* Индикаторы */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Натяжение лески */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Натяжение</span>
              <span
                className={clsx(
                  fightState.isCritical ? 'text-red-400 animate-pulse' : 'text-white'
                )}
              >
                {Math.round(fightState.lineTension)}%
              </span>
            </div>
            <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={clsx(
                  'h-full transition-all duration-100',
                  fightState.lineTension < 50
                    ? 'bg-green-500'
                    : fightState.lineTension < 80
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                )}
                style={{ width: `${fightState.lineTension}%` }}
              />
            </div>
          </div>

          {/* Выносливость рыбы */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Выносливость рыбы</span>
              <span>{Math.round(fightState.fishStamina)}%</span>
            </div>
            <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-water transition-all duration-100"
                style={{ width: `${fightState.fishStamina}%` }}
              />
            </div>
          </div>

          {/* Дистанция */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Дистанция</span>
              <span>{Math.round(fightState.fishDistance)} м</span>
            </div>
            <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-100"
                style={{ width: `${Math.min(100, fightState.fishDistance * 2)}%` }}
              />
            </div>
          </div>

          {/* Здоровье лески */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Состояние лески</span>
              <span>{Math.round(fightState.lineHealth)}%</span>
            </div>
            <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={clsx(
                  'h-full transition-all duration-100',
                  fightState.lineHealth > 50 ? 'bg-green-500' : 'bg-orange-500'
                )}
                style={{ width: `${fightState.lineHealth}%` }}
              />
            </div>
          </div>
        </div>

        {/* Фрикцион */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Фрикцион</span>
            <span>{Math.round(fightState.dragLevel * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={fightState.dragLevel}
            onChange={(e) => onDragChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Кнопки управления */}
        <div className="flex gap-2">
          <button
            onMouseDown={() => onReel(0.5)}
            onMouseUp={() => {}}
            onMouseLeave={() => {}}
            className={clsx(
              'flex-1 py-4 rounded-lg font-bold text-lg transition-all',
              isReeling
                ? 'bg-green-600 scale-95'
                : 'bg-green-500 hover:bg-green-600'
            )}
          >
            🔄 Подмотка
          </button>
          <button
            onClick={onRelease}
            className="flex-1 py-4 rounded-lg font-bold text-lg bg-red-500 hover:bg-red-600 transition-all"
          >
            ↩️ Отпустить
          </button>
        </div>

        {/* Подсказка при рывке */}
        {fightState.fishState === 'rush' && (
          <div className="mt-4 text-center text-red-400 animate-bounce">
            ⚠️ НАЖМИ ОТПУСТИТЬ!
          </div>
        )}
      </div>
    </div>
  )
}

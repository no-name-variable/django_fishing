/**
 * Главная игровая страница с подводным дизайном
 */
import { useEffect, useState } from 'react'
import { useFishing } from '../hooks/useFishing'
import { useInventoryStore } from '../store/inventoryStore'
import { api } from '../api/client'
import type { Location } from '../types'
import FishingCanvas from '../components/game/FishingCanvas'
import FightMeter from '../components/game/FightMeter'
import CatchResult from '../components/game/CatchResult'
import BiteIndicator from '../components/game/BiteIndicator'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import { clsx } from 'clsx'

export default function GamePage() {
  const fishing = useFishing()
  const { equipment, fetchEquipment } = useInventoryStore()
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null)

  // Загружаем данные при монтировании
  useEffect(() => {
    fetchEquipment()
    api.getLocations().then((data) => {
      setLocations(
        data.map((l) => ({
          id: l.id,
          name: l.name,
          description: l.description,
          image: l.image,
          maxDepth: l.max_depth,
          requiredLevel: l.required_level,
        }))
      )
    })
  }, [fetchEquipment])

  // Присоединяемся к локации
  const handleJoinLocation = () => {
    if (selectedLocation) {
      fishing.joinLocation(selectedLocation)
    }
  }

  // Проверка готовности
  if (!equipment?.isComplete) {
    return (
      <Card className="text-center py-12 max-w-md mx-auto">
        <div className="text-5xl mb-4">🎣</div>
        <h2 className="text-xl font-bold text-white mb-2">Экипировка не готова</h2>
        <p className="text-gray-400 mb-6">
          Перейдите в инвентарь и экипируйте все снасти, чтобы начать рыбалку
        </p>
        <a
          href="/inventory"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                   bg-primary-600 text-white font-medium
                   hover:bg-primary-500 transition-colors shadow-glow-sm"
        >
          <span>📦</span>
          <span>Открыть инвентарь</span>
        </a>
      </Card>
    )
  }

  // Выбор локации
  if (!fishing.currentLocation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Выберите локацию</h1>
          <div className="text-sm text-gray-400">
            Доступно: {locations.length} мест
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((loc) => (
            <Card
              key={loc.id}
              hover
              glow={selectedLocation === loc.id}
              onClick={() => setSelectedLocation(loc.id)}
              className={clsx(
                'cursor-pointer transition-all',
                selectedLocation === loc.id && 'ring-2 ring-water/50'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">🏞️</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">{loc.name}</h3>
                  <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                    {loc.description}
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-sm">
                    <span className="text-water-light flex items-center gap-1">
                      <span>🌊</span>
                      <span>до {loc.maxDepth}м</span>
                    </span>
                    {loc.requiredLevel > 1 && (
                      <span className="text-amber-400 flex items-center gap-1">
                        <span>🔒</span>
                        <span>Ур. {loc.requiredLevel}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {selectedLocation && (
          <div className="flex justify-center">
            <button
              onClick={handleJoinLocation}
              className="flex items-center gap-2 px-8 py-4 rounded-xl
                       bg-primary-600 text-white font-bold text-lg
                       hover:bg-primary-500 transition-all shadow-glow
                       animate-pulse-slow"
            >
              <span>🎣</span>
              <span>Начать рыбалку</span>
            </button>
          </div>
        )}

        {/* Ошибки */}
        {fishing.error && (
          <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/50
                        rounded-xl p-4 text-red-300">
            <span>❌</span>
            <span>{fishing.error}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl">📍</div>
          <div>
            <h1 className="text-xl font-bold text-white">
              {fishing.currentLocation.name}
            </h1>
            <div className="text-sm text-gray-400">
              {getStateLabel(fishing.gameState)}
            </div>
          </div>
        </div>

        {/* Индикатор состояния */}
        <div className={clsx(
          'px-3 py-1.5 rounded-full text-sm font-medium',
          fishing.gameState === 'idle' && 'bg-gray-500/20 text-gray-300',
          fishing.gameState === 'waiting' && 'bg-blue-500/20 text-blue-300 animate-pulse',
          fishing.gameState === 'bite' && 'bg-amber-500/20 text-amber-300 animate-pulse',
          fishing.gameState === 'fighting' && 'bg-red-500/20 text-red-300 animate-pulse'
        )}>
          {fishing.gameState === 'idle' && '💤 Готов'}
          {fishing.gameState === 'waiting' && '🎣 Ожидание...'}
          {fishing.gameState === 'bite' && '⚡ Поклёвка!'}
          {fishing.gameState === 'fighting' && '🐟 Борьба!'}
        </div>
      </div>

      {/* Игровой экран */}
      <div className="relative rounded-2xl overflow-hidden border border-water/20 shadow-card">
        <FishingCanvas fishing={fishing} />

        {/* Оверлеи состояний */}
        {fishing.gameState === 'bite' && (
          <BiteIndicator onHook={fishing.hook} />
        )}

        {fishing.gameState === 'fighting' && fishing.fightState && (
          <FightMeter
            fightState={fishing.fightState}
            onReel={fishing.startReeling}
            onRelease={fishing.release}
            onDragChange={fishing.setDrag}
            isReeling={fishing.isReeling}
          />
        )}

        {fishing.lastCatchResult && (
          <CatchResult
            result={fishing.lastCatchResult}
            onClose={() => {}}
          />
        )}
      </div>

      {/* Панель управления */}
      {fishing.gameState === 'idle' && (
        <Card>
          <CardHeader>
            <CardTitle>Заброс</CardTitle>
          </CardHeader>

          <div className="space-y-4">
            {/* Сила заброса */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Сила заброса</span>
                <span className="text-water-light font-medium">
                  {Math.round(fishing.castPower * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={fishing.castPower}
                onChange={(e) => fishing.setCastPower(parseFloat(e.target.value))}
                className="w-full h-2 bg-water-abyss/50 rounded-full appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-4
                         [&::-webkit-slider-thumb]:h-4
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-primary-500
                         [&::-webkit-slider-thumb]:shadow-glow-sm"
              />
            </div>

            {/* Угол заброса */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Угол</span>
                <span className="text-water-light font-medium">
                  {fishing.castAngle}°
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="5"
                value={fishing.castAngle}
                onChange={(e) => fishing.setCastAngle(parseInt(e.target.value))}
                className="w-full h-2 bg-water-abyss/50 rounded-full appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-4
                         [&::-webkit-slider-thumb]:h-4
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-primary-500
                         [&::-webkit-slider-thumb]:shadow-glow-sm"
              />
            </div>

            {/* Кнопка заброса */}
            <button
              onClick={fishing.cast}
              className="w-full py-4 rounded-xl font-bold text-lg
                       bg-primary-600 text-white
                       hover:bg-primary-500 transition-all
                       shadow-glow-sm active:scale-98"
            >
              <span className="mr-2">🎣</span>
              Забросить
            </button>
          </div>
        </Card>
      )}

      {fishing.gameState === 'waiting' && (
        <Card className="text-center py-8">
          <div className="text-4xl mb-3 animate-bounce">🎣</div>
          <div className="text-lg text-gray-300 mb-1">Ожидание поклёвки...</div>
          <div className="text-sm text-gray-500">Следите за индикатором</div>
        </Card>
      )}

      {/* Ошибки */}
      {fishing.error && (
        <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/50
                      rounded-xl p-4 text-red-300">
          <span>❌</span>
          <span>{fishing.error}</span>
        </div>
      )}
    </div>
  )
}

function getStateLabel(state: string): string {
  switch (state) {
    case 'idle':
      return 'Готов к забросу'
    case 'waiting':
      return 'Ожидание поклёвки'
    case 'bite':
      return 'Поклёвка!'
    case 'fighting':
      return 'Вываживание'
    default:
      return state
  }
}

/**
 * Главная игровая страница
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
      <div className="card text-center py-12">
        <h2 className="text-xl mb-4">Экипировка не готова</h2>
        <p className="text-gray-400 mb-4">
          Перейдите в инвентарь и экипируйте все снасти
        </p>
        <a href="/inventory" className="btn-primary">
          Открыть инвентарь
        </a>
      </div>
    )
  }

  // Выбор локации
  if (!fishing.currentLocation) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Выберите локацию</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((loc) => (
            <div
              key={loc.id}
              onClick={() => setSelectedLocation(loc.id)}
              className={`card cursor-pointer transition-all ${
                selectedLocation === loc.id
                  ? 'border-water ring-2 ring-water/50'
                  : 'hover:border-water/50'
              }`}
            >
              <h3 className="text-lg font-semibold">{loc.name}</h3>
              <p className="text-gray-400 text-sm mt-1">{loc.description}</p>
              <div className="mt-2 text-sm">
                <span className="text-water-light">
                  Глубина: до {loc.maxDepth}м
                </span>
              </div>
            </div>
          ))}
        </div>

        {selectedLocation && (
          <button onClick={handleJoinLocation} className="btn-primary">
            Начать рыбалку
          </button>
        )}

        {/* Ошибки */}
        {fishing.error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-300">
            {fishing.error}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">
          📍 {fishing.currentLocation.name}
        </h1>
        <div className="text-sm text-gray-400">
          Состояние: <span className="text-water-light">{fishing.gameState}</span>
        </div>
      </div>

      {/* Игровой экран */}
      <div className="relative">
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
        <div className="card">
          <h3 className="font-semibold mb-3">Заброс</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400">
                Сила: {Math.round(fishing.castPower * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={fishing.castPower}
                onChange={(e) => fishing.setCastPower(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">
                Угол: {fishing.castAngle}°
              </label>
              <input
                type="range"
                min="0"
                max="90"
                step="5"
                value={fishing.castAngle}
                onChange={(e) => fishing.setCastAngle(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <button onClick={fishing.cast} className="btn-primary w-full">
              Забросить
            </button>
          </div>
        </div>
      )}

      {fishing.gameState === 'waiting' && (
        <div className="card text-center py-8 animate-pulse-slow">
          <div className="text-2xl mb-2">🎣</div>
          <div className="text-gray-400">Ожидание поклёвки...</div>
        </div>
      )}

      {/* Ошибки */}
      {fishing.error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-300">
          {fishing.error}
        </div>
      )}
    </div>
  )
}

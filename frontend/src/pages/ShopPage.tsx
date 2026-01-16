/**
 * Страница магазина
 */
import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useInventoryStore } from '../store/inventoryStore'
import { useUserStore } from '../store/userStore'
import { clsx } from 'clsx'

type Tab = 'rods' | 'reels' | 'lines' | 'baits'

interface ShopItem {
  id: number
  name: string
  description: string
  tier?: string
  tierDisplay?: string
  price: number
  requiredLevel: number
  stats: Record<string, number | string>
}

export default function ShopPage() {
  const { user, fetchProfile } = useUserStore()
  const { purchaseItem } = useInventoryStore()

  const [activeTab, setActiveTab] = useState<Tab>('rods')
  const [items, setItems] = useState<ShopItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [buyQuantity, setBuyQuantity] = useState<Record<number, number>>({})

  // Загрузка предметов при смене вкладки
  useEffect(() => {
    loadItems()
  }, [activeTab])

  const loadItems = async () => {
    setIsLoading(true)
    try {
      let data: ShopItem[] = []

      switch (activeTab) {
        case 'rods': {
          const rods = await api.getRods()
          data = rods.map((r) => ({
            id: r.id,
            name: r.name,
            description: r.description,
            tier: r.tier,
            tierDisplay: r.tier_display,
            price: r.price,
            requiredLevel: r.required_level,
            stats: {
              'Мощность': r.power,
              'Чувствительность': r.sensitivity,
              'Макс. тест': `${r.max_line_weight} кг`,
            },
          }))
          break
        }
        case 'reels': {
          const reels = await api.getReels()
          data = reels.map((r) => ({
            id: r.id,
            name: r.name,
            description: r.description,
            tier: r.tier,
            tierDisplay: r.tier_display,
            price: r.price,
            requiredLevel: r.required_level,
            stats: {
              'Передаточное число': `${r.gear_ratio}:1`,
              'Сила фрикциона': `${r.drag_power} кг`,
              'Скорость подмотки': r.retrieve_speed,
            },
          }))
          break
        }
        case 'lines': {
          const lines = await api.getLines()
          data = lines.map((l) => ({
            id: l.id,
            name: l.name,
            description: l.description,
            tier: l.tier,
            tierDisplay: l.tier_display,
            price: l.price,
            requiredLevel: l.required_level,
            stats: {
              'Разрывная нагрузка': `${l.breaking_strength} кг`,
              'Заметность': l.visibility,
              'Длина': `${l.length} м`,
            },
          }))
          break
        }
        case 'baits': {
          const baits = await api.getBaits()
          data = baits.map((b) => ({
            id: b.id,
            name: b.name,
            description: b.description,
            price: b.price,
            requiredLevel: b.required_level,
            stats: {
              'Тип': b.bait_type_display,
              'Использований': b.uses,
              'Бонус': `+${b.attraction_bonus}%`,
            },
          }))
          break
        }
      }

      setItems(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBuy = async (item: ShopItem, quantity = 1) => {
    if (!user) return

    if (user.level < item.requiredLevel) {
      setError(`Требуется уровень ${item.requiredLevel}`)
      return
    }

    if (user.money < item.price * quantity) {
      setError('Недостаточно денег')
      return
    }

    const itemType = activeTab.slice(0, -1) // rods -> rod
    const success = await purchaseItem(itemType, item.id, quantity)

    if (success) {
      await fetchProfile()
      setError('')
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'rods', label: 'Удочки' },
    { key: 'reels', label: 'Катушки' },
    { key: 'lines', label: 'Лески' },
    { key: 'baits', label: 'Наживки' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Магазин</h1>
        {user && (
          <div className="text-xl text-yellow-400">💰 {user.money}</div>
        )}
      </div>

      {/* Вкладки */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              'px-4 py-2 rounded-lg transition-colors',
              activeTab === tab.key
                ? 'bg-water text-white'
                : 'bg-gray-700 hover:bg-gray-600'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Ошибка */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-300">
          {error}
        </div>
      )}

      {/* Список товаров */}
      {isLoading ? (
        <div className="text-center py-12">Загрузка...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const canBuy = user && user.level >= item.requiredLevel
            const canAfford = user && user.money >= item.price
            const quantity = buyQuantity[item.id] || 1

            return (
              <div key={item.id} className="card">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{item.name}</h3>
                  {item.tierDisplay && (
                    <span className="text-sm text-gray-400">
                      {item.tierDisplay}
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-400 mb-3">{item.description}</p>

                {/* Характеристики */}
                <div className="space-y-1 mb-3">
                  {Object.entries(item.stats).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-400">{key}</span>
                      <span className="text-water-light">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Требования и цена */}
                <div className="flex justify-between items-center mb-3">
                  <div className="text-sm">
                    {item.requiredLevel > 1 && (
                      <span
                        className={clsx(
                          canBuy ? 'text-gray-400' : 'text-red-400'
                        )}
                      >
                        Ур. {item.requiredLevel}
                      </span>
                    )}
                  </div>
                  <div className="text-yellow-400 font-bold">
                    💰 {item.price * quantity}
                  </div>
                </div>

                {/* Количество (для наживок) */}
                {activeTab === 'baits' && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-gray-400">Кол-во:</span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={quantity}
                      onChange={(e) =>
                        setBuyQuantity({
                          ...buyQuantity,
                          [item.id]: parseInt(e.target.value) || 1,
                        })
                      }
                      className="input w-20 text-center"
                    />
                  </div>
                )}

                {/* Кнопка покупки */}
                <button
                  onClick={() => handleBuy(item, quantity)}
                  disabled={!canBuy || !canAfford}
                  className={clsx(
                    'w-full py-2 rounded-lg font-semibold transition-colors',
                    canBuy && canAfford
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  )}
                >
                  {!canBuy
                    ? `Требуется ур. ${item.requiredLevel}`
                    : !canAfford
                    ? 'Недостаточно денег'
                    : 'Купить'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/**
 * Страница магазина с подводным дизайном
 */
import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useInventoryStore } from '../store/inventoryStore'
import { useUserStore } from '../store/userStore'
import { clsx } from 'clsx'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'

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

// Цвета для уровней снаряжения
const tierColors: Record<string, string> = {
  basic: 'text-gray-400 border-gray-500/30 bg-gray-500/10',
  amateur: 'text-green-400 border-green-500/30 bg-green-500/10',
  professional: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  expert: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
  master: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
}

export default function ShopPage() {
  const { user, fetchProfile } = useUserStore()
  const { purchaseItem } = useInventoryStore()

  const [activeTab, setActiveTab] = useState<Tab>('rods')
  const [items, setItems] = useState<ShopItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [buyQuantity, setBuyQuantity] = useState<Record<number, number>>({})

  // Загрузка предметов при смене вкладки
  useEffect(() => {
    loadItems()
  }, [activeTab])

  // Скрыть сообщения через 3 сек
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('')
        setSuccess('')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

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
    const purchased = await purchaseItem(itemType, item.id, quantity)

    if (purchased) {
      await fetchProfile()
      setError('')
      setSuccess(`${item.name} добавлен в инвентарь!`)
    }
  }

  const tabConfig: Record<Tab, { label: string; icon: string }> = {
    rods: { label: 'Удочки', icon: '🎣' },
    reels: { label: 'Катушки', icon: '⚙️' },
    lines: { label: 'Лески', icon: '🧵' },
    baits: { label: 'Наживки', icon: '🪱' },
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Магазин</h1>
        {user && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl
                        bg-amber-900/30 border border-amber-500/30">
            <span className="text-xl">💰</span>
            <span className="text-xl font-bold text-amber-400">
              {user.money.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Вкладки */}
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(tabConfig) as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200',
              activeTab === tab
                ? 'bg-primary-600 text-white shadow-glow-sm'
                : 'bg-water-dark/50 text-gray-300 hover:bg-water-dark/70 border border-water/20'
            )}
          >
            <span>{tabConfig[tab].icon}</span>
            <span>{tabConfig[tab].label}</span>
          </button>
        ))}
      </div>

      {/* Уведомления */}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/50
                      rounded-xl p-4 text-red-300 animate-fade-in">
          <span>❌</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/50
                      rounded-xl p-4 text-green-300 animate-fade-in">
          <span>✅</span>
          <span>{success}</span>
        </div>
      )}

      {/* Список товаров */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-water-light animate-pulse">Загрузка товаров...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const canBuy = user && user.level >= item.requiredLevel
            const canAfford = user && user.money >= item.price
            const quantity = buyQuantity[item.id] || 1
            const totalPrice = item.price * quantity

            return (
              <ShopItemCard
                key={item.id}
                item={item}
                quantity={quantity}
                totalPrice={totalPrice}
                canBuy={!!canBuy}
                canAfford={!!canAfford}
                isBait={activeTab === 'baits'}
                onQuantityChange={(q) => setBuyQuantity({ ...buyQuantity, [item.id]: q })}
                onBuy={() => handleBuy(item, quantity)}
              />
            )
          })}
        </div>
      )}

      {/* Пустой магазин */}
      {!isLoading && items.length === 0 && (
        <Card className="text-center py-12">
          <div className="text-5xl mb-4 opacity-30">🏪</div>
          <div className="text-gray-400">Товары не найдены</div>
        </Card>
      )}
    </div>
  )
}

// Карточка товара
function ShopItemCard({
  item,
  quantity,
  totalPrice,
  canBuy,
  canAfford,
  isBait,
  onQuantityChange,
  onBuy,
}: {
  item: ShopItem
  quantity: number
  totalPrice: number
  canBuy: boolean
  canAfford: boolean
  isBait: boolean
  onQuantityChange: (q: number) => void
  onBuy: () => void
}) {
  const tierClass = item.tier ? tierColors[item.tier] || '' : ''

  return (
    <Card hover className="flex flex-col">
      {/* Заголовок и уровень */}
      <CardHeader>
        <CardTitle>{item.name}</CardTitle>
        {item.tierDisplay && (
          <span className={clsx(
            'text-xs px-2 py-1 rounded-full border',
            tierClass
          )}>
            {item.tierDisplay}
          </span>
        )}
      </CardHeader>

      {/* Описание */}
      <p className="text-sm text-gray-400 mb-4 line-clamp-2">{item.description}</p>

      {/* Характеристики */}
      <div className="space-y-2 mb-4 flex-1">
        {Object.entries(item.stats).map(([key, value]) => (
          <div key={key} className="flex justify-between text-sm">
            <span className="text-gray-400">{key}</span>
            <span className="text-water-light font-medium">{value}</span>
          </div>
        ))}
      </div>

      {/* Требование уровня */}
      {item.requiredLevel > 1 && (
        <div className={clsx(
          'text-sm mb-3 flex items-center gap-1',
          canBuy ? 'text-gray-400' : 'text-red-400'
        )}>
          <span>🔒</span>
          <span>Требуется уровень {item.requiredLevel}</span>
        </div>
      )}

      {/* Количество для наживок */}
      {isBait && (
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-gray-400">Количество:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-lg bg-water-dark/50 text-gray-300
                       hover:bg-water-dark/70 transition-colors"
            >
              -
            </button>
            <input
              type="number"
              min="1"
              max="100"
              value={quantity}
              onChange={(e) => onQuantityChange(parseInt(e.target.value) || 1)}
              className="w-16 h-8 rounded-lg bg-water-abyss/50 border border-water/20
                       text-center text-white focus:outline-none focus:border-water/50"
            />
            <button
              onClick={() => onQuantityChange(Math.min(100, quantity + 1))}
              className="w-8 h-8 rounded-lg bg-water-dark/50 text-gray-300
                       hover:bg-water-dark/70 transition-colors"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Цена и кнопка покупки */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="text-xs text-gray-400">Цена</div>
          <div className="text-xl font-bold text-amber-400 flex items-center gap-1">
            <span>💰</span>
            <span>{totalPrice.toLocaleString()}</span>
          </div>
        </div>

        <button
          onClick={onBuy}
          disabled={!canBuy || !canAfford}
          className={clsx(
            'px-6 py-3 rounded-xl font-semibold transition-all duration-200',
            canBuy && canAfford
              ? 'bg-green-600 hover:bg-green-500 text-white shadow-glow-sm'
              : 'bg-water-abyss/50 text-gray-500 cursor-not-allowed'
          )}
        >
          {!canBuy
            ? 'Низкий ур.'
            : !canAfford
            ? 'Нет денег'
            : 'Купить'}
        </button>
      </div>
    </Card>
  )
}

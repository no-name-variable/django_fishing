/**
 * Страница инвентаря с подводным дизайном
 */
import { useEffect, useState } from 'react'
import { useInventoryStore } from '../store/inventoryStore'
import { clsx } from 'clsx'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import type { PlayerEquipment } from '../types'

type ItemType = 'rod' | 'reel' | 'line' | 'bait'

// Проверка экипирован ли предмет
function isItemEquipped(
  equipment: PlayerEquipment | null,
  item: { id: number; itemType: string }
): boolean {
  if (!equipment) return false
  const slot = equipment[item.itemType as ItemType]
  if (!slot || typeof slot === 'boolean') return false
  return slot.id === item.id
}

export default function InventoryPage() {
  const { items, equipment, fetchInventory, fetchEquipment, equipItem, isLoading } =
    useInventoryStore()
  const [activeFilter, setActiveFilter] = useState<ItemType | 'all'>('all')

  useEffect(() => {
    fetchInventory()
    fetchEquipment()
  }, [fetchInventory, fetchEquipment])

  // Фильтрация предметов
  const filteredItems = activeFilter === 'all'
    ? items
    : items.filter(item => item.itemType === activeFilter)

  // Группировка предметов по типу
  const groupedItems = filteredItems.reduce(
    (acc, item) => {
      if (!acc[item.itemType]) acc[item.itemType] = []
      acc[item.itemType].push(item)
      return acc
    },
    {} as Record<string, typeof items>
  )

  const typeConfig: Record<ItemType, { label: string; icon: string; slotLabel: string }> = {
    rod: { label: 'Удочки', icon: '🎣', slotLabel: 'Удочка' },
    reel: { label: 'Катушки', icon: '⚙️', slotLabel: 'Катушка' },
    line: { label: 'Лески', icon: '🧵', slotLabel: 'Леска' },
    bait: { label: 'Наживки', icon: '🪱', slotLabel: 'Наживка' },
  }

  const handleEquip = async (itemId: number, slot: string) => {
    await equipItem(itemId, slot)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-water-light animate-pulse">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Инвентарь</h1>
        <div className="text-sm text-gray-400">
          Предметов: {items.length}
        </div>
      </div>

      {/* Текущая экипировка */}
      <Card>
        <CardHeader>
          <CardTitle>Экипировка</CardTitle>
          {equipment && !equipment.isComplete && (
            <div className="text-sm text-amber-400 flex items-center gap-1">
              <span>⚠️</span>
              <span>Экипируйте все снасти</span>
            </div>
          )}
        </CardHeader>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['rod', 'reel', 'line', 'bait'] as const).map((slot) => {
            const equipped = equipment?.[slot]
            const config = typeConfig[slot]

            return (
              <div
                key={slot}
                className={clsx(
                  'relative p-4 rounded-xl border-2 transition-all duration-300',
                  equipped
                    ? 'border-water/50 bg-gradient-to-br from-water-dark/40 to-water-deeper/40'
                    : 'border-dashed border-water/20 bg-water-abyss/20'
                )}
              >
                {/* Иконка слота */}
                <div className="text-center">
                  <div className={clsx(
                    'text-3xl mb-2',
                    equipped ? 'opacity-100' : 'opacity-30'
                  )}>
                    {config.icon}
                  </div>
                  <div className="text-xs text-gray-400 mb-2">{config.slotLabel}</div>

                  {equipped ? (
                    <>
                      <div className="font-semibold text-white truncate">
                        {equipped.itemName}
                      </div>
                      {slot === 'bait' ? (
                        <div className="text-sm text-water-light mt-1">
                          x{equipped.quantity}
                        </div>
                      ) : (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Прочность</span>
                            <span>{equipped.durability}%</span>
                          </div>
                          <div className="h-1.5 bg-water-abyss/50 rounded-full overflow-hidden">
                            <div
                              className={clsx(
                                'h-full rounded-full transition-all',
                                equipped.durability > 50
                                  ? 'bg-green-500'
                                  : equipped.durability > 20
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                              )}
                              style={{ width: `${equipped.durability}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-gray-500 text-sm">Пусто</div>
                  )}
                </div>

                {/* Индикатор экипированности */}
                {equipped && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Фильтры */}
      <div className="flex gap-2 flex-wrap">
        <FilterButton
          active={activeFilter === 'all'}
          onClick={() => setActiveFilter('all')}
          icon="📦"
          label="Все"
          count={items.length}
        />
        {(Object.keys(typeConfig) as ItemType[]).map((type) => (
          <FilterButton
            key={type}
            active={activeFilter === type}
            onClick={() => setActiveFilter(type)}
            icon={typeConfig[type].icon}
            label={typeConfig[type].label}
            count={items.filter(i => i.itemType === type).length}
          />
        ))}
      </div>

      {/* Список предметов */}
      {activeFilter === 'all' ? (
        // Группировка по типам
        Object.entries(groupedItems).map(([type, typeItems]) => (
          <Card key={type}>
            <CardHeader>
              <CardTitle>
                <span className="mr-2">{typeConfig[type as ItemType].icon}</span>
                {typeConfig[type as ItemType].label}
              </CardTitle>
              <span className="text-sm text-gray-400">{typeItems.length} шт.</span>
            </CardHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {typeItems.map((item) => (
                <InventoryItemCard
                  key={item.id}
                  item={item}
                  isEquipped={isItemEquipped(equipment, item)}
                  onEquip={() => handleEquip(item.id, item.itemType)}
                />
              ))}
            </div>
          </Card>
        ))
      ) : (
        // Единый список по фильтру
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="mr-2">{typeConfig[activeFilter].icon}</span>
              {typeConfig[activeFilter].label}
            </CardTitle>
            <span className="text-sm text-gray-400">{filteredItems.length} шт.</span>
          </CardHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredItems.map((item) => (
              <InventoryItemCard
                key={item.id}
                item={item}
                isEquipped={isItemEquipped(equipment, item)}
                onEquip={() => handleEquip(item.id, item.itemType)}
              />
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              Нет предметов этого типа
            </div>
          )}
        </Card>
      )}

      {/* Пустой инвентарь */}
      {items.length === 0 && (
        <Card className="text-center py-12">
          <div className="text-5xl mb-4 opacity-30">📦</div>
          <div className="text-gray-400 mb-4">Инвентарь пуст</div>
          <a
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                     bg-primary-600 text-white font-medium
                     hover:bg-primary-500 transition-colors shadow-glow-sm"
          >
            <span>🛒</span>
            <span>Перейти в магазин</span>
          </a>
        </Card>
      )}
    </div>
  )
}

// Кнопка фильтра
function FilterButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  icon: string
  label: string
  count: number
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200',
        active
          ? 'bg-primary-600 text-white shadow-glow-sm'
          : 'bg-water-dark/50 text-gray-300 hover:bg-water-dark/70 border border-water/20'
      )}
    >
      <span>{icon}</span>
      <span>{label}</span>
      <span className={clsx(
        'text-xs px-1.5 py-0.5 rounded-full',
        active ? 'bg-white/20' : 'bg-water-abyss/50'
      )}>
        {count}
      </span>
    </button>
  )
}

// Карточка предмета
function InventoryItemCard({
  item,
  isEquipped,
  onEquip,
}: {
  item: {
    id: number
    itemName: string
    itemType: string
    quantity: number
    durability: number
  }
  isEquipped: boolean
  onEquip: () => void
}) {
  return (
    <div
      className={clsx(
        'p-4 rounded-xl border transition-all duration-300',
        isEquipped
          ? 'border-water/50 bg-gradient-to-br from-water-dark/50 to-water-deeper/50 shadow-glow-sm'
          : 'border-water/10 bg-water-dark/30 hover:bg-water-dark/50 hover:border-water/30'
      )}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white truncate">{item.itemName}</div>

          {item.itemType === 'bait' ? (
            <div className="text-sm text-water-light mt-1">
              Количество: {item.quantity}
            </div>
          ) : (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Прочность</span>
                <span>{item.durability}%</span>
              </div>
              <div className="h-1.5 bg-water-abyss/50 rounded-full overflow-hidden">
                <div
                  className={clsx(
                    'h-full rounded-full transition-all',
                    item.durability > 50
                      ? 'bg-green-500'
                      : item.durability > 20
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  )}
                  style={{ width: `${item.durability}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0">
          {isEquipped ? (
            <div className="flex items-center gap-1 text-sm text-green-400">
              <span>✓</span>
              <span>Надето</span>
            </div>
          ) : (
            <button
              onClick={onEquip}
              className="px-3 py-1.5 rounded-lg text-sm font-medium
                       bg-water/20 text-water-light border border-water/30
                       hover:bg-water/30 transition-colors"
            >
              Надеть
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

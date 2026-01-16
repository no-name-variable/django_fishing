/**
 * Страница инвентаря
 */
import { useEffect } from 'react'
import { useInventoryStore } from '../store/inventoryStore'
import { clsx } from 'clsx'

export default function InventoryPage() {
  const { items, equipment, fetchInventory, fetchEquipment, equipItem, isLoading } =
    useInventoryStore()

  useEffect(() => {
    fetchInventory()
    fetchEquipment()
  }, [fetchInventory, fetchEquipment])

  // Группировка предметов по типу
  const groupedItems = items.reduce(
    (acc, item) => {
      if (!acc[item.itemType]) acc[item.itemType] = []
      acc[item.itemType].push(item)
      return acc
    },
    {} as Record<string, typeof items>
  )

  const typeLabels: Record<string, string> = {
    rod: 'Удочки',
    reel: 'Катушки',
    line: 'Лески',
    bait: 'Наживки',
  }

  const slotLabels: Record<string, string> = {
    rod: 'Удочка',
    reel: 'Катушка',
    line: 'Леска',
    bait: 'Наживка',
  }

  const handleEquip = async (itemId: number, slot: string) => {
    await equipItem(itemId, slot)
  }

  if (isLoading) {
    return <div className="text-center py-12">Загрузка...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Инвентарь</h1>

      {/* Текущая экипировка */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Экипировка</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['rod', 'reel', 'line', 'bait'] as const).map((slot) => {
            const equipped = equipment?.[slot]
            return (
              <div
                key={slot}
                className={clsx(
                  'p-4 rounded-lg border-2 border-dashed text-center',
                  equipped ? 'border-water bg-water/10' : 'border-gray-600'
                )}
              >
                <div className="text-sm text-gray-400 mb-2">{slotLabels[slot]}</div>
                {equipped ? (
                  <>
                    <div className="font-semibold">{equipped.itemName}</div>
                    {slot === 'bait' && (
                      <div className="text-sm text-gray-400">
                        x{equipped.quantity}
                      </div>
                    )}
                    {slot !== 'bait' && (
                      <div className="text-sm text-gray-400">
                        {equipped.durability}%
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-gray-500">Пусто</div>
                )}
              </div>
            )
          })}
        </div>
        {equipment && !equipment.isComplete && (
          <div className="mt-4 text-yellow-400 text-sm">
            ⚠️ Экипируйте все снасти для начала рыбалки
          </div>
        )}
      </div>

      {/* Список предметов */}
      {Object.entries(groupedItems).map(([type, typeItems]) => (
        <div key={type} className="card">
          <h2 className="text-lg font-semibold mb-4">{typeLabels[type]}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {typeItems.map((item) => {
              const isEquipped =
                equipment?.[item.itemType as keyof typeof equipment]?.id === item.id

              return (
                <div
                  key={item.id}
                  className={clsx(
                    'p-3 rounded-lg border',
                    isEquipped
                      ? 'border-water bg-water/20'
                      : 'border-gray-700 bg-gray-800/50'
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{item.itemName}</div>
                      {item.itemType === 'bait' && (
                        <div className="text-sm text-gray-400">
                          Осталось: {item.quantity}
                        </div>
                      )}
                      {item.itemType !== 'bait' && (
                        <div className="text-sm text-gray-400">
                          Прочность: {item.durability}%
                        </div>
                      )}
                    </div>
                    {!isEquipped && (
                      <button
                        onClick={() => handleEquip(item.id, item.itemType)}
                        className="btn-secondary text-sm"
                      >
                        Экипировать
                      </button>
                    )}
                    {isEquipped && (
                      <span className="text-water-light text-sm">✓ Надето</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <div className="card text-center py-8">
          <div className="text-gray-400">Инвентарь пуст</div>
          <a href="/shop" className="btn-primary mt-4 inline-block">
            Перейти в магазин
          </a>
        </div>
      )}
    </div>
  )
}

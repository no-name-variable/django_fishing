/**
 * Store для инвентаря
 */
import { create } from 'zustand'
import { api } from '../api/client'
import type { InventoryItem, PlayerEquipment } from '../types'

interface InventoryState {
  items: InventoryItem[]
  equipment: PlayerEquipment | null
  isLoading: boolean
  error: string | null

  // Действия
  fetchInventory: () => Promise<void>
  fetchEquipment: () => Promise<void>
  purchaseItem: (itemType: string, itemId: number, quantity?: number) => Promise<boolean>
  equipItem: (inventoryItemId: number, slot: string) => Promise<boolean>
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  equipment: null,
  isLoading: false,
  error: null,

  fetchInventory: async () => {
    set({ isLoading: true })
    try {
      const data = await api.getInventory()
      set({
        items: data.map((item) => ({
          id: item.id,
          itemType: item.item_type as InventoryItem['itemType'],
          itemId: item.item_id,
          itemName: item.item_name,
          quantity: item.quantity,
          durability: item.durability,
        })),
        error: null,
      })
    } catch (e) {
      set({ error: (e as Error).message })
    } finally {
      set({ isLoading: false })
    }
  },

  fetchEquipment: async () => {
    try {
      const data = await api.getEquipment()
      const mapItem = (item: typeof data.rod): InventoryItem | null => {
        if (!item) return null
        return {
          id: item.id,
          itemType: item.item_type as InventoryItem['itemType'],
          itemId: item.item_id,
          itemName: item.item_name,
          quantity: item.quantity,
          durability: item.durability,
        }
      }

      set({
        equipment: {
          rod: mapItem(data.rod),
          reel: mapItem(data.reel),
          line: mapItem(data.line),
          bait: mapItem(data.bait),
          isComplete: data.is_complete,
        },
      })
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },

  purchaseItem: async (itemType, itemId, quantity = 1) => {
    try {
      const result = await api.purchaseItem(itemType, itemId, quantity)
      if (result.success) {
        // Обновляем инвентарь
        await get().fetchInventory()
        return true
      }
      set({ error: result.message })
      return false
    } catch (e) {
      set({ error: (e as Error).message })
      return false
    }
  },

  equipItem: async (inventoryItemId, slot) => {
    try {
      const result = await api.equipItem(inventoryItemId, slot)
      if (result.success) {
        // Обновляем экипировку
        await get().fetchEquipment()
        return true
      }
      set({ error: result.message })
      return false
    } catch (e) {
      set({ error: (e as Error).message })
      return false
    }
  },
}))

/**
 * Типы данных для Fishing Game
 */

// Редкость
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

// Пользователь
export interface User {
  id: number
  username: string
  email: string
  level: number
  experience: number
  money: number
  totalFishCaught: number
  biggestFishWeight: number
  experienceForNextLevel: number
}

// Локация
export interface Location {
  id: number
  name: string
  description: string
  image: string | null
  maxDepth: number
  requiredLevel: number
}

// Рыба
export interface Fish {
  id: number
  name: string
  description: string
  image: string | null
  minWeight: number
  maxWeight: number
  rarity: Rarity
  rarityDisplay: string
  basePrice: number
  strength: number
  stamina: number
  aggressiveness: number
}

// Снаряжение
export interface Equipment {
  id: number
  name: string
  description: string
  image: string | null
  tier: string
  tierDisplay: string
  price: number
  requiredLevel: number
}

export interface Rod extends Equipment {
  power: number
  sensitivity: number
  maxLineWeight: number
  castDistanceBonus: number
}

export interface Reel extends Equipment {
  gearRatio: number
  dragPower: number
  lineCapacity: number
  retrieveSpeed: number
}

export interface Line extends Equipment {
  breakingStrength: number
  visibility: number
  stretch: number
  length: number
}

export interface Bait {
  id: number
  name: string
  description: string
  image: string | null
  baitType: string
  baitTypeDisplay: string
  uses: number
  attractionBonus: number
  price: number
  requiredLevel: number
  isConsumable: boolean
}

// Инвентарь
export interface InventoryItem {
  id: number
  itemType: 'rod' | 'reel' | 'line' | 'bait'
  itemId: number
  itemName: string
  quantity: number
  durability: number
}

export interface PlayerEquipment {
  rod: InventoryItem | null
  reel: InventoryItem | null
  line: InventoryItem | null
  bait: InventoryItem | null
  isComplete: boolean
}

// Игровая сессия
export type GameState = 'idle' | 'casting' | 'waiting' | 'bite' | 'fighting' | 'catching'
export type FishState = 'passive' | 'active' | 'rush' | 'exhausted'

export interface FightState {
  fishState: FishState
  fishStamina: number
  fishDistance: number
  fishDirection: number
  lineTension: number
  lineHealth: number
  dragLevel: number
  isCritical: boolean
}

export interface CatchResult {
  success: boolean
  fishName?: string
  weight?: number
  price?: number
  experience?: number
  leveledUp?: boolean
  newLevel?: number
  achievements?: string[]
  reason?: string
}

// WebSocket сообщения
export interface WSMessage {
  type: string
  [key: string]: unknown
}

// Достижения
export interface Achievement {
  id: number
  name: string
  description: string
  icon: string | null
  unlocked: boolean
  progress: number
  target: number
  rewardMoney: number
  rewardExperience: number
}

// Статистика
export interface PlayerStats {
  totalCasts: number
  successfulCatches: number
  fishEscaped: number
  lineBreaks: number
  catchRate: number
  commonCaught: number
  uncommonCaught: number
  rareCaught: number
  epicCaught: number
  legendaryCaught: number
  longestFightSeconds: number
  fastestCatchSeconds: number
  totalPlayTimeSeconds: number
}

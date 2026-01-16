/**
 * API клиент для взаимодействия с бэкендом
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
}

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    // Восстанавливаем токен из localStorage
    this.token = localStorage.getItem('access_token')
  }

  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem('access_token', token)
    } else {
      localStorage.removeItem('access_token')
    }
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || error.detail || 'Ошибка запроса')
    }

    return response.json()
  }

  // Auth
  async login(username: string, password: string) {
    const data = await this.request<{ access: string; refresh: string }>(
      '/token/pair',
      { method: 'POST', body: { username, password } }
    )
    this.setToken(data.access)
    return data
  }

  async register(username: string, email: string, password: string) {
    return this.request<{ message: string }>(
      '/users/register',
      { method: 'POST', body: { username, email, password } }
    )
  }

  async getProfile() {
    return this.request<{
      id: number
      username: string
      email: string
      level: number
      experience: number
      money: number
      total_fish_caught: number
      biggest_fish_weight: number
      experience_for_next_level: number
    }>('/users/me')
  }

  // Fishing
  async getLocations() {
    return this.request<Array<{
      id: number
      name: string
      description: string
      image: string | null
      max_depth: number
      required_level: number
    }>>('/fishing/locations')
  }

  async getFishAtLocation(locationId: number) {
    return this.request<Array<{
      id: number
      name: string
      description: string
      image: string | null
      min_weight: number
      max_weight: number
      rarity: string
      rarity_display: string
      base_price: number
      strength: number
      stamina: number
      aggressiveness: number
    }>>(`/fishing/locations/${locationId}/fish`)
  }

  async getCatches(limit = 20) {
    return this.request<Array<{
      id: number
      fish_name: string
      fish_rarity: string
      location_name: string
      weight: number
      price: number
      experience: number
      caught_at: string
    }>>(`/fishing/catches?limit=${limit}`)
  }

  // Equipment
  async getRods(availableOnly = false) {
    const query = availableOnly ? '?available_only=true' : ''
    return this.request<Array<{
      id: number
      name: string
      description: string
      image: string | null
      tier: string
      tier_display: string
      power: number
      sensitivity: number
      max_line_weight: number
      cast_distance_bonus: number
      price: number
      required_level: number
    }>>(`/equipment/rods${query}`)
  }

  async getReels(availableOnly = false) {
    const query = availableOnly ? '?available_only=true' : ''
    return this.request<Array<{
      id: number
      name: string
      description: string
      image: string | null
      tier: string
      tier_display: string
      gear_ratio: number
      drag_power: number
      line_capacity: number
      retrieve_speed: number
      price: number
      required_level: number
    }>>(`/equipment/reels${query}`)
  }

  async getLines(availableOnly = false) {
    const query = availableOnly ? '?available_only=true' : ''
    return this.request<Array<{
      id: number
      name: string
      description: string
      image: string | null
      tier: string
      tier_display: string
      breaking_strength: number
      visibility: number
      stretch: number
      length: number
      price: number
      required_level: number
    }>>(`/equipment/lines${query}`)
  }

  async getBaits(availableOnly = false) {
    const query = availableOnly ? '?available_only=true' : ''
    return this.request<Array<{
      id: number
      name: string
      description: string
      image: string | null
      bait_type: string
      bait_type_display: string
      uses: number
      attraction_bonus: number
      price: number
      required_level: number
      is_consumable: boolean
    }>>(`/equipment/baits${query}`)
  }

  // Inventory
  async getInventory() {
    return this.request<Array<{
      id: number
      item_type: string
      item_id: number
      item_name: string
      quantity: number
      durability: number
    }>>('/inventory/items')
  }

  async getEquipment() {
    return this.request<{
      rod: { id: number; item_type: string; item_id: number; item_name: string; quantity: number; durability: number } | null
      reel: { id: number; item_type: string; item_id: number; item_name: string; quantity: number; durability: number } | null
      line: { id: number; item_type: string; item_id: number; item_name: string; quantity: number; durability: number } | null
      bait: { id: number; item_type: string; item_id: number; item_name: string; quantity: number; durability: number } | null
      is_complete: boolean
    }>('/inventory/equipment')
  }

  async purchaseItem(itemType: string, itemId: number, quantity = 1) {
    return this.request<{ message: string; success: boolean }>(
      '/inventory/purchase',
      { method: 'POST', body: { item_type: itemType, item_id: itemId, quantity } }
    )
  }

  async equipItem(inventoryItemId: number, slot: string) {
    return this.request<{ message: string; success: boolean }>(
      '/inventory/equip',
      { method: 'POST', body: { inventory_item_id: inventoryItemId, slot } }
    )
  }

  // Progression
  async getAchievements() {
    return this.request<Array<{
      id: number
      name: string
      description: string
      icon: string | null
      unlocked: boolean
      progress: number
      target: number
      reward_money: number
      reward_experience: number
    }>>('/progression/achievements')
  }

  async getStats() {
    return this.request<{
      total_casts: number
      successful_catches: number
      fish_escaped: number
      line_breaks: number
      catch_rate: number
      common_caught: number
      uncommon_caught: number
      rare_caught: number
      epic_caught: number
      legendary_caught: number
      longest_fight_seconds: number
      fastest_catch_seconds: number
      total_play_time_seconds: number
    }>('/progression/stats')
  }

  logout() {
    this.setToken(null)
  }
}

export const api = new ApiClient(API_URL)

/**
 * Основной layout приложения
 */
import { Outlet, NavLink } from 'react-router-dom'
import { useUserStore } from '../../store/userStore'
import { useEffect } from 'react'

export default function Layout() {
  const { user, fetchProfile, logout } = useUserStore()

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-water-dark/90 backdrop-blur-sm border-b border-water/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Лого */}
          <div className="text-xl font-bold text-water-light">
            🎣 Fishing Game
          </div>

          {/* Навигация */}
          <nav className="flex gap-4">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-3 py-1 rounded-lg transition-colors ${
                  isActive ? 'bg-water text-white' : 'text-gray-300 hover:text-white'
                }`
              }
            >
              Игра
            </NavLink>
            <NavLink
              to="/inventory"
              className={({ isActive }) =>
                `px-3 py-1 rounded-lg transition-colors ${
                  isActive ? 'bg-water text-white' : 'text-gray-300 hover:text-white'
                }`
              }
            >
              Инвентарь
            </NavLink>
            <NavLink
              to="/shop"
              className={({ isActive }) =>
                `px-3 py-1 rounded-lg transition-colors ${
                  isActive ? 'bg-water text-white' : 'text-gray-300 hover:text-white'
                }`
              }
            >
              Магазин
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `px-3 py-1 rounded-lg transition-colors ${
                  isActive ? 'bg-water text-white' : 'text-gray-300 hover:text-white'
                }`
              }
            >
              Профиль
            </NavLink>
          </nav>

          {/* Профиль */}
          {user && (
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <div className="text-gray-300">
                  {user.username}{' '}
                  <span className="text-water-light">Ур. {user.level}</span>
                </div>
                <div className="text-yellow-400">💰 {user.money}</div>
              </div>
              <button onClick={logout} className="btn-secondary text-sm">
                Выход
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}

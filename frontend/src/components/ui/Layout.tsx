/**
 * Основной layout приложения
 */
import { Outlet, NavLink } from 'react-router-dom'
import { useUserStore } from '../../store/userStore'
import { useEffect } from 'react'
import UnderwaterBackground from './UnderwaterBackground'

export default function Layout() {
  const { user, fetchProfile, logout } = useUserStore()

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Подводный фон */}
      <UnderwaterBackground />

      {/* Контент */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-water-darker/80 backdrop-blur-md border-b border-water/20 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            {/* Лого */}
            <div className="text-xl font-bold text-water-light flex items-center gap-2">
              <span className="text-2xl">🎣</span>
              <span>Fishing Game</span>
            </div>

            {/* Навигация */}
            <nav className="flex gap-2">
              {[
                { to: '/', label: 'Игра' },
                { to: '/inventory', label: 'Инвентарь' },
                { to: '/shop', label: 'Магазин' },
                { to: '/profile', label: 'Профиль' },
              ].map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-600 text-white shadow-glow-sm'
                        : 'text-gray-300 hover:text-white hover:bg-water-dark/50'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Профиль */}
            {user && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-gray-300">
                    {user.username}{' '}
                    <span className="text-water-light font-medium">
                      Ур. {user.level}
                    </span>
                  </div>
                  <div className="text-accent-gold font-semibold flex items-center justify-end gap-1">
                    <span>💰</span>
                    <span>{user.money.toLocaleString()}</span>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium
                           bg-red-500/20 text-red-300 border border-red-500/30
                           hover:bg-red-500/30 transition-colors"
                >
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
    </div>
  )
}

/**
 * Страница авторизации
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../store/userStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, register, isLoading, error } = useUserStore()

  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    try {
      if (isRegister) {
        await register(username, email, password)
        // После регистрации автоматически логинимся
        await login(username, password)
      } else {
        await login(username, password)
      }
      navigate('/')
    } catch (e) {
      setLocalError((e as Error).message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-water-dark">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">
          🎣 Fishing Game
        </h1>

        <div className="flex mb-6">
          <button
            onClick={() => setIsRegister(false)}
            className={`flex-1 py-2 text-center rounded-l-lg ${
              !isRegister ? 'bg-water text-white' : 'bg-water-dark/50'
            }`}
          >
            Вход
          </button>
          <button
            onClick={() => setIsRegister(true)}
            className={`flex-1 py-2 text-center rounded-r-lg ${
              isRegister ? 'bg-water text-white' : 'bg-water-dark/50'
            }`}
          >
            Регистрация
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Имя пользователя
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input"
              required
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              required
            />
          </div>

          {(error || localError) && (
            <div className="text-red-400 text-sm">
              {error || localError}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full"
          >
            {isLoading ? 'Загрузка...' : isRegister ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  )
}

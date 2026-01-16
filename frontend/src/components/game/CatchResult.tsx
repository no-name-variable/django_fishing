/**
 * Результат улова
 */
import type { CatchResult as CatchResultType } from '../../types'

interface Props {
  result: CatchResultType
  onClose: () => void
}

export default function CatchResult({ result, onClose }: Props) {
  if (result.success) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
        <div className="card max-w-md text-center">
          <div className="text-6xl mb-4">🐟</div>
          <h2 className="text-2xl font-bold text-green-400 mb-2">
            Поймано!
          </h2>
          <div className="text-xl mb-4">{result.fishName}</div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-water-dark/50 rounded-lg p-3">
              <div className="text-gray-400 text-sm">Вес</div>
              <div className="text-xl font-bold">{result.weight} кг</div>
            </div>
            <div className="bg-water-dark/50 rounded-lg p-3">
              <div className="text-gray-400 text-sm">Цена</div>
              <div className="text-xl font-bold text-yellow-400">
                💰 {result.price}
              </div>
            </div>
          </div>

          <div className="bg-blue-500/20 rounded-lg p-3 mb-4">
            <div className="text-blue-300">+{result.experience} опыта</div>
          </div>

          {result.leveledUp && (
            <div className="bg-purple-500/20 rounded-lg p-3 mb-4 animate-pulse">
              <div className="text-purple-300 text-xl font-bold">
                🎉 Уровень {result.newLevel}!
              </div>
            </div>
          )}

          {result.achievements && result.achievements.length > 0 && (
            <div className="bg-yellow-500/20 rounded-lg p-3 mb-4">
              <div className="text-yellow-300 font-bold mb-2">
                🏆 Новые достижения:
              </div>
              {result.achievements.map((ach, i) => (
                <div key={i} className="text-yellow-200">{ach}</div>
              ))}
            </div>
          )}

          <button onClick={onClose} className="btn-primary w-full">
            Продолжить
          </button>
        </div>
      </div>
    )
  }

  // Неудача
  const failureMessages: Record<string, string> = {
    line_break: 'Леска порвалась!',
    line_worn: 'Леска износилась!',
    fish_escaped: 'Рыба сорвалась!',
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
      <div className="card max-w-md text-center">
        <div className="text-6xl mb-4">😢</div>
        <h2 className="text-2xl font-bold text-red-400 mb-4">
          {failureMessages[result.reason || ''] || 'Неудача!'}
        </h2>
        <p className="text-gray-400 mb-4">
          Не расстраивайтесь, в следующий раз повезёт!
        </p>
        <button onClick={onClose} className="btn-primary w-full">
          Попробовать снова
        </button>
      </div>
    </div>
  )
}

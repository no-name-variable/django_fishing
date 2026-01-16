/**
 * Индикатор поклёвки
 */
interface Props {
  onHook: () => void
}

export default function BiteIndicator({ onHook }: Props) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/30 animate-pulse">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-bounce">🎣</div>
        <div className="text-3xl font-bold text-yellow-400 mb-4 animate-pulse">
          ПОКЛЁВКА!
        </div>
        <button
          onClick={onHook}
          className="btn-success text-2xl px-8 py-4 animate-bounce"
        >
          ПОДСЕЧЬ!
        </button>
        <div className="text-gray-300 mt-2">
          Нажмите быстро, пока рыба не сорвалась!
        </div>
      </div>
    </div>
  )
}

/**
 * Страница профиля с подводным дизайном
 */
import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useUserStore } from '../store/userStore'
import type { Achievement, PlayerStats } from '../types'
import { clsx } from 'clsx'
import Card, { CardHeader, CardTitle } from '../components/ui/Card'
import StatCard, { RarityCard } from '../components/ui/StatCard'
import ProgressBar from '../components/ui/ProgressBar'

export default function ProfilePage() {
  const { user } = useUserStore()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [achData, statsData] = await Promise.all([
        api.getAchievements(),
        api.getStats(),
      ])

      setAchievements(
        achData.map((a) => ({
          id: a.id,
          name: a.name,
          description: a.description,
          icon: a.icon,
          unlocked: a.unlocked,
          progress: a.progress,
          target: a.target,
          rewardMoney: a.reward_money,
          rewardExperience: a.reward_experience,
        }))
      )

      setStats({
        totalCasts: statsData.total_casts,
        successfulCatches: statsData.successful_catches,
        fishEscaped: statsData.fish_escaped,
        lineBreaks: statsData.line_breaks,
        catchRate: statsData.catch_rate,
        commonCaught: statsData.common_caught,
        uncommonCaught: statsData.uncommon_caught,
        rareCaught: statsData.rare_caught,
        epicCaught: statsData.epic_caught,
        legendaryCaught: statsData.legendary_caught,
        longestFightSeconds: statsData.longest_fight_seconds,
        fastestCatchSeconds: statsData.fastest_catch_seconds,
        totalPlayTimeSeconds: statsData.total_play_time_seconds,
      })
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-water-light animate-pulse">Загрузка...</div>
      </div>
    )
  }

  const unlockedCount = achievements.filter((a) => a.unlocked).length

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Профиль</h1>
        <div className="text-sm text-gray-400">
          Время в игре: {formatPlayTime(stats?.totalPlayTimeSeconds || 0)}
        </div>
      </div>

      {/* Основной блок профиля */}
      <Card className="overflow-hidden">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Аватар и имя */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-water to-water-dark
                            flex items-center justify-center text-5xl
                            ring-4 ring-water/30 shadow-glow">
                🎣
              </div>
              <div className="absolute -bottom-1 -right-1 bg-primary-600 text-white
                            text-xs font-bold px-2 py-0.5 rounded-full shadow-lg">
                Ур. {user.level}
              </div>
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-xl font-bold text-white">{user.username}</h2>
              <div className="text-sm text-gray-400">{user.email}</div>
            </div>
          </div>

          {/* Статистика справа */}
          <div className="flex-1 space-y-4">
            {/* Опыт */}
            <div className="bg-water-abyss/30 rounded-xl p-4">
              <ProgressBar
                value={user.experience}
                max={user.experienceForNextLevel}
                label="Опыт до следующего уровня"
                color="blue"
                size="lg"
              />
            </div>

            {/* Деньги и основные показатели */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                icon="💰"
                label="Баланс"
                value={user.money.toLocaleString()}
                color="gold"
              />
              <StatCard
                icon="🐟"
                label="Всего поймано"
                value={user.totalFishCaught}
                color="blue"
              />
              <StatCard
                icon="🏆"
                label="Рекорд"
                value={`${user.biggestFishWeight} кг`}
                color="green"
              />
              <StatCard
                icon="🎯"
                label="Точность"
                value={`${stats?.catchRate || 0}%`}
                color="default"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Статистика и редкости */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Детальная статистика */}
          <Card>
            <CardHeader>
              <CardTitle>Статистика</CardTitle>
            </CardHeader>

            <div className="grid grid-cols-2 gap-3">
              <StatItem label="Забросов" value={stats.totalCasts} icon="🎣" />
              <StatItem label="Поймано" value={stats.successfulCatches} icon="✅" />
              <StatItem label="Сорвалось" value={stats.fishEscaped} icon="💨" />
              <StatItem label="Обрывов" value={stats.lineBreaks} icon="💔" />
              <StatItem
                label="Самый долгий бой"
                value={formatTime(stats.longestFightSeconds)}
                icon="⏱️"
              />
              <StatItem
                label="Быстрейший улов"
                value={formatTime(stats.fastestCatchSeconds)}
                icon="⚡"
              />
            </div>
          </Card>

          {/* По редкостям */}
          <Card>
            <CardHeader>
              <CardTitle>Улов по редкости</CardTitle>
            </CardHeader>

            <div className="grid grid-cols-5 gap-2">
              <RarityCard count={stats.commonCaught} label="Обычные" color="#9CA3AF" />
              <RarityCard count={stats.uncommonCaught} label="Необычные" color="#22C55E" />
              <RarityCard count={stats.rareCaught} label="Редкие" color="#3B82F6" />
              <RarityCard count={stats.epicCaught} label="Эпические" color="#A855F7" />
              <RarityCard count={stats.legendaryCaught} label="Легенд." color="#F97316" />
            </div>

            {/* Визуальная шкала редкостей */}
            <div className="mt-4 h-3 rounded-full overflow-hidden flex">
              {stats.successfulCatches > 0 && (
                <>
                  <div
                    className="bg-gray-400 h-full"
                    style={{ width: `${(stats.commonCaught / stats.successfulCatches) * 100}%` }}
                  />
                  <div
                    className="bg-green-500 h-full"
                    style={{ width: `${(stats.uncommonCaught / stats.successfulCatches) * 100}%` }}
                  />
                  <div
                    className="bg-blue-500 h-full"
                    style={{ width: `${(stats.rareCaught / stats.successfulCatches) * 100}%` }}
                  />
                  <div
                    className="bg-purple-500 h-full"
                    style={{ width: `${(stats.epicCaught / stats.successfulCatches) * 100}%` }}
                  />
                  <div
                    className="bg-orange-500 h-full"
                    style={{ width: `${(stats.legendaryCaught / stats.successfulCatches) * 100}%` }}
                  />
                </>
              )}
              {stats.successfulCatches === 0 && (
                <div className="bg-water-abyss/50 h-full w-full" />
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Достижения */}
      <Card>
        <CardHeader>
          <CardTitle>
            Достижения
          </CardTitle>
          <div className="text-sm text-water-light font-medium">
            {unlockedCount} / {achievements.length}
          </div>
        </CardHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {achievements.map((ach) => (
            <AchievementCard key={ach.id} achievement={ach} />
          ))}
        </div>

        {achievements.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            Достижения пока не загружены
          </div>
        )}
      </Card>
    </div>
  )
}

// Компонент достижения
function AchievementCard({ achievement: ach }: { achievement: Achievement }) {
  const progress = ach.target > 0 ? (ach.progress / ach.target) * 100 : 0

  return (
    <div
      className={clsx(
        'p-4 rounded-xl border transition-all duration-300',
        ach.unlocked
          ? 'bg-gradient-to-br from-amber-900/30 to-amber-950/20 border-amber-500/30 shadow-glow-sm'
          : 'bg-water-dark/30 border-water/10 opacity-70 hover:opacity-100'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={clsx(
          'text-3xl p-2 rounded-lg',
          ach.unlocked ? 'bg-amber-500/20' : 'bg-water-abyss/30'
        )}>
          {ach.unlocked ? '🏆' : '🔒'}
        </div>
        <div className="flex-1 min-w-0">
          <div className={clsx(
            'font-semibold truncate',
            ach.unlocked ? 'text-amber-200' : 'text-gray-300'
          )}>
            {ach.name}
          </div>
          <div className="text-sm text-gray-400 line-clamp-2">
            {ach.description}
          </div>

          {!ach.unlocked && ach.target > 0 && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{ach.progress}</span>
                <span>{ach.target}</span>
              </div>
              <div className="h-1.5 bg-water-abyss/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-water-light/70 rounded-full transition-all"
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
            </div>
          )}

          {(ach.rewardMoney > 0 || ach.rewardExperience > 0) && (
            <div className="mt-2 flex gap-3 text-xs">
              {ach.rewardMoney > 0 && (
                <span className="text-amber-400 flex items-center gap-1">
                  <span>💰</span>
                  <span>+{ach.rewardMoney}</span>
                </span>
              )}
              {ach.rewardExperience > 0 && (
                <span className="text-blue-400 flex items-center gap-1">
                  <span>⭐</span>
                  <span>+{ach.rewardExperience}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Элемент статистики
function StatItem({
  label,
  value,
  icon
}: {
  label: string
  value: string | number
  icon: string
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-water-abyss/20">
      <span className="text-xl">{icon}</span>
      <div>
        <div className="text-lg font-semibold text-white">{value}</div>
        <div className="text-xs text-gray-400">{label}</div>
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  if (seconds === 0) return '-'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins > 0) {
    return `${mins}м ${secs}с`
  }
  return `${secs}с`
}

function formatPlayTime(seconds: number): string {
  if (seconds === 0) return '0ч'
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}ч ${mins}м`
  }
  return `${mins}м`
}

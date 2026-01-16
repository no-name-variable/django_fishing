/**
 * Страница профиля
 */
import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useUserStore } from '../store/userStore'
import type { Achievement, PlayerStats } from '../types'
import { clsx } from 'clsx'

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
    return <div className="text-center py-12">Загрузка...</div>
  }

  // Прогресс опыта
  const expProgress = (user.experience / user.experienceForNextLevel) * 100

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Профиль</h1>

      {/* Основная информация */}
      <div className="card">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-water flex items-center justify-center text-4xl">
            🎣
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{user.username}</h2>
            <div className="text-gray-400">{user.email}</div>
            <div className="mt-2 flex items-center gap-4">
              <div className="text-water-light font-semibold">
                Уровень {user.level}
              </div>
              <div className="text-yellow-400">💰 {user.money}</div>
            </div>
          </div>
        </div>

        {/* Прогресс опыта */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Опыт</span>
            <span>
              {user.experience} / {user.experienceForNextLevel}
            </span>
          </div>
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${expProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Статистика */}
      {stats && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Статистика</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBlock label="Забросов" value={stats.totalCasts} />
            <StatBlock label="Поймано" value={stats.successfulCatches} />
            <StatBlock label="Сорвалось" value={stats.fishEscaped} />
            <StatBlock label="Обрывов" value={stats.lineBreaks} />
            <StatBlock label="Процент улова" value={`${stats.catchRate}%`} />
            <StatBlock
              label="Самый большой улов"
              value={`${user.biggestFishWeight} кг`}
            />
            <StatBlock
              label="Всего поймано"
              value={`${user.totalFishCaught} шт`}
            />
            <StatBlock
              label="Самый долгий бой"
              value={formatTime(stats.longestFightSeconds)}
            />
          </div>

          {/* По редкостям */}
          <h3 className="text-md font-semibold mt-6 mb-3">По редкости</h3>
          <div className="grid grid-cols-5 gap-2">
            <div className="text-center p-2 rounded-lg bg-gray-600/30">
              <div className="text-2xl font-bold text-fish-common">
                {stats.commonCaught}
              </div>
              <div className="text-xs text-gray-400">Обычные</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-green-500/20">
              <div className="text-2xl font-bold text-fish-uncommon">
                {stats.uncommonCaught}
              </div>
              <div className="text-xs text-gray-400">Необычные</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-blue-500/20">
              <div className="text-2xl font-bold text-fish-rare">
                {stats.rareCaught}
              </div>
              <div className="text-xs text-gray-400">Редкие</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-purple-500/20">
              <div className="text-2xl font-bold text-fish-epic">
                {stats.epicCaught}
              </div>
              <div className="text-xs text-gray-400">Эпические</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-orange-500/20">
              <div className="text-2xl font-bold text-fish-legendary">
                {stats.legendaryCaught}
              </div>
              <div className="text-xs text-gray-400">Легендарные</div>
            </div>
          </div>
        </div>
      )}

      {/* Достижения */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">
          Достижения ({achievements.filter((a) => a.unlocked).length}/{achievements.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={clsx(
                'p-3 rounded-lg border',
                ach.unlocked
                  ? 'border-yellow-500/50 bg-yellow-500/10'
                  : 'border-gray-700 opacity-60'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">
                  {ach.unlocked ? '🏆' : '🔒'}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{ach.name}</div>
                  <div className="text-sm text-gray-400">{ach.description}</div>

                  {!ach.unlocked && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>{ach.progress}</span>
                        <span>{ach.target}</span>
                      </div>
                      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-water"
                          style={{
                            width: `${Math.min(100, (ach.progress / ach.target) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-2 flex gap-2 text-xs">
                    {ach.rewardMoney > 0 && (
                      <span className="text-yellow-400">💰 +{ach.rewardMoney}</span>
                    )}
                    {ach.rewardExperience > 0 && (
                      <span className="text-blue-400">⭐ +{ach.rewardExperience}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-water-dark/50 rounded-lg p-3 text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
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

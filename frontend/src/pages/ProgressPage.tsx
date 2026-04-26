import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Trophy, Target, Flame, TrendingUp, BookOpen, Star, CheckCircle2, ArrowRight, Activity, Medal, Crown } from 'lucide-react';
import api from '../services/api';
import type { Achievement, LeaderboardEntry, UserProgress, UserStats, UserStreak } from '../types';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function ProgressPage() {
  const { data: progress, isLoading } = useQuery<UserStats>({
    queryKey: ['progress-stats'],
    queryFn: () => api.get('/progress/stats').then((r) => r.data),
  });

  const { data: streak } = useQuery<UserStreak>({
    queryKey: ['progress-streak'],
    queryFn: () => api.get('/progress/streak').then((r) => r.data),
  });

  const { data: achievements } = useQuery<Achievement[]>({
    queryKey: ['progress-achievements'],
    queryFn: () => api.get('/progress/achievements').then((r) => r.data),
  });

  const { data: recentProgress } = useQuery<UserProgress[]>({
    queryKey: ['progress-history'],
    queryFn: () => api.get('/progress').then((r) => r.data),
  });

  const { data: leaderboard } = useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard'],
    queryFn: () => api.get('/progress/leaderboard?limit=10').then((r) => r.data),
  });

  const earnedAchievements = achievements ?? [];
  const recentItems = recentProgress?.slice(0, 8) ?? [];
  const completionRate = useMemo(() => {
    const attempted = progress?.exercises_completed ?? 0;
    const correct = progress?.exercises_correct ?? 0;
    if (attempted === 0) return 0;
    return Math.round((correct / attempted) * 100);
  }, [progress?.exercises_completed, progress?.exercises_correct]);

  const stats = [
    {
      label: 'Пройдені уроки',
      value: progress?.lessons_completed ?? 0,
      icon: BookOpen,
      bg: 'bg-primary-50',
      text: 'text-primary-600',
    },
    {
      label: 'Досвід (XP)',
      value: progress?.total_xp ?? 0,
      icon: Star,
      bg: 'bg-amber-50',
      text: 'text-amber-600',
    },
    {
      label: 'Серія (днів)',
      value: streak?.current_streak ?? progress?.current_streak ?? 0,
      icon: Flame,
      bg: 'bg-orange-50',
      text: 'text-orange-600',
    },
    {
      label: 'Точність',
      value: `${Math.round(progress?.accuracy ?? 0)}%`,
      icon: Target,
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
    },
    {
      label: 'Мов у навчанні',
      value: progress?.languages_studying ?? 0,
      icon: TrendingUp,
      bg: 'bg-sky-50',
      text: 'text-sky-600',
    },
    {
      label: 'Виконано вправ',
      value: progress?.exercises_completed ?? 0,
      icon: CheckCircle2,
      bg: 'bg-violet-50',
      text: 'text-violet-600',
    },
  ];

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="h-8 w-48 skeleton rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 skeleton rounded-2xl" />
          ))}
        </div>
        <div className="h-72 skeleton rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 skeleton rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8"
    >
      {/* Header */}
      <motion.div variants={item} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-primary-500/20">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Мій прогрес</h1>
          <p className="text-sm text-gray-500">Ваша статистика навчання</p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="glass rounded-2xl p-4 border border-gray-100 hover-lift transition-all"
          >
            <div
              className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}
            >
              <s.icon className={`w-5 h-5 ${s.text}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </motion.div>

      <motion.div variants={item} className="grid lg:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-5 h-5 text-primary-500" />
            <h2 className="font-bold text-gray-900">Якість відповідей</h2>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{completionRate}%</p>
          <p className="text-sm text-gray-500">{progress?.exercises_correct ?? 0} правильних із {progress?.exercises_completed ?? 0} виконаних вправ</p>
        </div>
        <div className="glass rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-5 h-5 text-orange-500" />
            <h2 className="font-bold text-gray-900">Страйк</h2>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{streak?.current_streak ?? 0}</p>
          <p className="text-sm text-gray-500">Найдовший страйк: {streak?.longest_streak ?? progress?.longest_streak ?? 0} днів</p>
        </div>
        <div className="glass rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Medal className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-gray-900">Досягнення</h2>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{earnedAchievements.length}</p>
          <p className="text-sm text-gray-500">Зароблених бейджів у профілі</p>
        </div>
      </motion.div>

      {/* Achievements */}
      <motion.div variants={item}>
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-bold text-gray-900">Досягнення</h2>
          <span className="ml-auto text-sm text-gray-400">
            {earnedAchievements.length}
          </span>
        </div>
        {earnedAchievements.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {earnedAchievements.map((a) => (
            <div
              key={`${a.id}-${a.earned_at ?? 'earned'}`}
              className="glass rounded-xl p-4 flex items-center gap-3 transition-all border border-amber-200 bg-amber-50/50"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-amber-400 to-amber-500 shadow-md shadow-amber-500/20"
              >
                <span className="text-xl">{a.icon}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{a.name}</p>
                <p className="text-xs text-gray-400">{a.description}</p>
              </div>
            </div>
            ))}
          </div>
        ) : (
          <div className="glass rounded-2xl p-6 text-sm text-gray-500 border border-gray-100">
            Досягнень поки що немає. Завершіть кілька уроків, щоб вони почали з’являтися.
          </div>
        )}
      </motion.div>

      <motion.div variants={item}>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-primary-500" />
          <h2 className="text-lg font-bold text-gray-900">Остання активність</h2>
          <span className="ml-auto text-sm text-gray-400">{recentItems.length}</span>
        </div>
        {recentItems.length > 0 ? (
          <div className="space-y-3">
            {recentItems.map((entry) => (
              <Link
                key={entry.id}
                to={entry.course_id ? `/courses/${entry.course_id}` : `/lessons/${entry.lesson_id}`}
                className="glass rounded-2xl p-4 border border-gray-100 flex items-center gap-4 hover-lift transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900">Урок #{entry.lesson_id}</p>
                  <p className="text-sm text-gray-500">Результат: {entry.score}% • XP: {entry.xp_earned ?? 0}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="glass rounded-2xl p-6 text-sm text-gray-500 border border-gray-100">
            Історії прогресу ще немає. Завершіть перший урок, щоб тут з’явилися записи.
          </div>
        )}
      </motion.div>

      {/* Leaderboard */}
      <motion.div variants={item}>
        <div className="flex items-center gap-2 mb-4">
          <Crown className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-bold text-gray-900">Рейтинг гравців</h2>
          <span className="ml-auto text-sm text-gray-400">Топ 10</span>
        </div>
        {leaderboard && leaderboard.length > 0 ? (
          <div className="glass rounded-2xl border border-gray-100 overflow-hidden">
            {leaderboard.map((entry, idx) => (
              <div
                key={entry.user_id}
                className={`flex items-center gap-4 px-5 py-3.5 transition-all ${
                  idx < leaderboard.length - 1 ? 'border-b border-gray-50 dark:border-white/5' : ''
                } ${entry.rank <= 3 ? 'bg-amber-50/40 dark:bg-amber-500/5' : 'hover:bg-gray-50/60 dark:hover:bg-violet-500/8'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                  entry.rank === 1 ? 'bg-amber-400 text-white shadow-lg shadow-amber-300/40' :
                  entry.rank === 2 ? 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200' :
                  entry.rank === 3 ? 'bg-amber-700 text-white' :
                  'bg-gray-100 dark:bg-white/8 text-gray-500 dark:text-gray-400'
                }`}>
                  {entry.rank <= 3 ? ['🥇','🥈','🥉'][entry.rank - 1] : entry.rank}
                </div>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary-50 text-xl shrink-0">
                  {entry.avatar_url && entry.avatar_url.trim() ? entry.avatar_url : entry.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{entry.username}</p>
                  <p className="text-xs text-gray-400">{entry.lessons_completed} уроків</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-amber-600">{entry.total_xp.toLocaleString('uk-UA')}</p>
                  <p className="text-xs text-gray-400">XP</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass rounded-2xl p-6 text-sm text-gray-500 border border-gray-100">
            Рейтинг ще порожній. Завершіть уроки, щоб потрапити в топ!
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

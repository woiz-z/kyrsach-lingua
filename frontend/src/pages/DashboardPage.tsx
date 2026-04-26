import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame, Zap, BookOpen, Trophy, ArrowRight, MessageSquare, Target,
  Sparkles, RotateCcw, Gamepad2, GraduationCap, ChevronDown, ChevronUp,
  Loader2, Brain,
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { Language, UserStats, UserStreak, LearningPlanResponse } from '../types';
import { CardSkeleton } from '../components/ui/Skeleton';
import LevelBadge from '../components/ui/LevelBadge';
import DailyTasksCard from '../components/ui/DailyTasksCard';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const TASK_TYPE_ICONS: Record<string, string> = {
  lesson: '📚',
  vocab: '🔤',
  chat: '💬',
  review: '🔁',
  pronunciation: '🎤',
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [planLangCode, setPlanLangCode] = useState('');
  const [planOpen, setPlanOpen] = useState(false);
  const [plan, setPlan] = useState<LearningPlanResponse | null>(null);

  const { data: languages, isLoading: langsLoading } = useQuery<Language[]>({ queryKey: ['languages'], queryFn: () => api.get('/languages').then((r) => r.data) });
  const { data: stats, isLoading: statsLoading } = useQuery<UserStats>({ queryKey: ['stats'], queryFn: () => api.get('/progress/stats').then((r) => r.data) });
  const { data: streak } = useQuery<UserStreak>({ queryKey: ['streak'], queryFn: () => api.get('/progress/streak').then((r) => r.data) });

  const planMutation = useMutation({
    mutationFn: (lang: string) =>
      api.post('/ai-tools/learning-plan', { language_code: lang }).then((r) => r.data as LearningPlanResponse),
    onSuccess: (data) => { setPlan(data); setPlanOpen(true); },
  });

  const statCards = [
    { icon: Zap, label: 'Загальний XP', value: stats?.total_xp ?? 0, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-100 dark:border-amber-500/20' },
    { icon: Flame, label: 'Поточний страйк', value: `${streak?.current_streak ?? 0} днів`, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-100 dark:border-orange-500/20' },
    { icon: BookOpen, label: 'Уроків пройдено', value: stats?.lessons_completed ?? 0, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-500/10', border: 'border-primary-100 dark:border-primary-500/20' },
    { icon: Trophy, label: 'Точність', value: `${stats?.accuracy ?? 0}%`, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20' },
  ];

  const greetingTime = (() => {
    const h = new Date().getHours();
    if (h < 6) return 'Доброї ночі';
    if (h < 12) return 'Доброго ранку';
    if (h < 18) return 'Доброго дня';
    return 'Доброго вечора';
  })();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold mb-1">
              {greetingTime}, <span className="gradient-text">{user?.full_name || user?.username}</span>! 👋
            </h1>
            <p className="text-gray-500 mb-3">Продовжуйте навчання — кожен день наближає вас до мети</p>
            {stats && <LevelBadge xp={stats.total_xp} showBar />}
          </div>
          {streak && streak.current_streak > 0 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/25"
            >
              <Flame className="w-5 h-5 text-orange-500 animate-flame" />
              <span className="font-bold text-orange-600 dark:text-orange-400">{streak.current_streak} 🔥</span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {statCards.map((s) => (
            <motion.div key={s.label} variants={item} className={`glass rounded-2xl p-5 border ${s.border} hover-lift`}>
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <s.icon className={`w-5 h-5 ${s.color}${s.label === 'Поточний страйк' && (streak?.current_streak ?? 0) > 0 ? ' animate-flame' : ''}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
      >
        <Link to="/chat" className="group glass rounded-2xl p-6 hover:shadow-xl hover-lift transition-all flex items-center gap-4 border border-transparent hover:border-primary-100 dark:hover:border-primary-500/30">
          <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center shrink-0 shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/35 transition-shadow">
            <MessageSquare className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-900">AI-репетитор</h3>
            <p className="text-sm text-gray-500">Практикуйте мову в реальному часі</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
        </Link>
        <Link to="/languages" className="group glass rounded-2xl p-6 hover:shadow-xl hover-lift transition-all flex items-center gap-4 border border-transparent hover:border-purple-100 dark:hover:border-purple-500/30">
          <div className="w-14 h-14 rounded-2xl bg-purple-500 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/35 transition-shadow">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-900">Нові курси</h3>
            <p className="text-sm text-gray-500">Оберіть мову та створіть AI-курс</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
        </Link>
        <Link to="/progress" className="group glass rounded-2xl p-6 hover:shadow-xl hover-lift transition-all flex items-center gap-4 border border-transparent hover:border-emerald-100 dark:hover:border-emerald-500/30">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/35 transition-shadow">
            <Target className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-900">Мій прогрес</h3>
            <p className="text-sm text-gray-500">Статистика та досягнення</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
        </Link>
        <Link to="/review" className="group glass rounded-2xl p-6 hover:shadow-xl hover-lift transition-all flex items-center gap-4 border border-transparent hover:border-blue-100 dark:hover:border-blue-500/30 md:col-span-3 lg:col-span-1">
          <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/35 transition-shadow">
            <RotateCcw className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-900">Швидке повторення</h3>
            <p className="text-sm text-gray-500">10 вправ з пройдених уроків</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
        </Link>
      </motion.div>

      {/* Daily tasks + AI Plan */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="grid md:grid-cols-2 gap-6 mb-10"
      >
        <DailyTasksCard />

        {/* AI Learning Plan */}
        <div className="glass rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-violet-500" />
              <h3 className="font-bold text-gray-900">AI-план навчання</h3>
            </div>
            {plan && (
              <button onClick={() => setPlanOpen((o) => !o)}
                className="text-gray-400 hover:text-gray-600">
                {planOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>

          {!plan ? (
            <>
              <p className="text-sm text-gray-500 mb-4">Отримайте персоналізований 7-денний план вивчення мови від AI</p>
              <select
                value={planLangCode}
                onChange={(e) => setPlanLangCode(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm text-gray-800 mb-3 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
              >
                <option value="">— оберіть мову —</option>
                {languages?.map((l) => (
                  <option key={l.code} value={l.code}>{l.flag_emoji} {l.name}</option>
                ))}
              </select>
              <button
                disabled={!planLangCode || planMutation.isPending}
                onClick={() => planMutation.mutate(planLangCode)}
                className="w-full bg-violet-500 hover:bg-violet-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {planMutation.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Генеруємо…</>
                  : <><Sparkles className="w-4 h-4" /> Скласти план</>
                }
              </button>
            </>
          ) : (
            <AnimatePresence>
              {planOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100 dark:border-white/8">
                    <span className="text-xs font-bold px-2 py-0.5 bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 rounded-full">
                      {plan.recommended_level}
                    </span>
                    <span className="text-xs text-gray-500">Ціль: {plan.weekly_goal_xp} XP/тиждень</span>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {plan.daily_plan.map((day) => (
                      <div key={day.day} className="text-sm">
                        <p className="font-semibold text-gray-700">{day.day}</p>
                        {day.tasks.map((t, i) => (
                          <p key={i} className="text-gray-500 text-xs ml-2">
                            {TASK_TYPE_ICONS[t.type] ?? '•'} {t.description} ({t.duration_min} хв)
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                  {plan.tips.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/8">
                      <p className="text-xs font-semibold text-gray-500 mb-1">💡 Поради:</p>
                      {plan.tips.map((tip, i) => (
                        <p key={i} className="text-xs text-gray-400">• {tip}</p>
                      ))}
                    </div>
                  )}
                  <button onClick={() => setPlan(null)}
                    className="mt-3 text-xs text-violet-500 hover:underline">
                    Скласти новий план
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </motion.div>

      {/* Extra game links */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid sm:grid-cols-3 gap-4 mb-10"
      >
        <Link to="/mini-game" className="group glass rounded-xl p-4 hover-lift flex items-center gap-3 border border-transparent hover:border-amber-100">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
            <Gamepad2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Гра «Пари»</p>
            <p className="text-xs text-gray-500">Слово ↔ переклад</p>
          </div>
        </Link>
        <Link to="/placement-test" className="group glass rounded-xl p-4 hover-lift flex items-center gap-3 border border-transparent hover:border-teal-100">
          <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Тест на рівень</p>
            <p className="text-xs text-gray-500">A1 → C1 оцінка</p>
          </div>
        </Link>
        <Link to="/achievements" className="group glass rounded-xl p-4 hover-lift flex items-center gap-3 border border-transparent hover:border-yellow-100">
          <div className="w-10 h-10 rounded-xl bg-yellow-500 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Досягнення</p>
            <p className="text-xs text-gray-500">Нагороди та значки</p>
          </div>
        </Link>
      </motion.div>

      {/* Languages */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Доступні мови</h2>
          <Link to="/languages" className="text-primary-500 text-sm font-medium hover:underline flex items-center gap-1">
            Усі мови <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {langsLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {languages?.slice(0, 8).map((lang) => (
              <motion.div key={lang.id} variants={item}>
                <Link to={`/languages?lang=${lang.id}`} className="block glass rounded-2xl p-5 hover:shadow-lg hover-lift transition-all border border-transparent hover:border-primary-100 dark:hover:border-primary-500/30">
                  <span className="text-4xl mb-3 block">{lang.flag_emoji}</span>
                  <h3 className="font-bold text-gray-900">{lang.name}</h3>
                  <p className="text-sm text-gray-500">{lang.native_name}</p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy, Lock, CheckCircle2, Loader2 } from 'lucide-react';
import api from '../services/api';
import type { Achievement } from '../types';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, scale: 0.92 }, show: { opacity: 1, scale: 1, transition: { duration: 0.3 } } };

const CONDITION_LABELS: Record<string, string> = {
  lessons: 'уроків',
  xp: 'XP',
  streak: 'днів поспіль',
  exercises: 'вправ',
};

export default function AchievementsPage() {
  const { data: achievements, isLoading } = useQuery<Achievement[]>({
    queryKey: ['achievements-all'],
    queryFn: () => api.get('/progress/achievements/all').then((r) => r.data),
  });

  const earned = achievements?.filter((a) => a.earned) ?? [];
  const locked = achievements?.filter((a) => !a.earned) ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Досягнення</h1>
          <p className="text-sm text-gray-500">
            {isLoading ? '…' : `${earned.length} / ${achievements?.length ?? 0} здобуто`}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
        </div>
      ) : (
        <>
          {/* Earned */}
          {earned.length > 0 && (
            <section className="mb-10">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Здобуті
              </h2>
              <motion.div variants={container} initial="hidden" animate="show"
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {earned.map((ach) => (
                  <motion.div key={ach.id} variants={item}
                    className="glass rounded-2xl p-4 border border-emerald-100 text-center hover-lift relative">
                    <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-emerald-500" />
                    <div className="text-4xl mb-2">{ach.icon}</div>
                    <p className="font-semibold text-gray-900 text-sm leading-tight">{ach.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{ach.description}</p>
                    {ach.earned_at && (
                      <p className="text-[10px] text-emerald-500 mt-2">
                        {new Date(ach.earned_at).toLocaleDateString('uk-UA')}
                      </p>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </section>
          )}

          {/* Locked */}
          {locked.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4 text-gray-400" /> Ще не здобуті
              </h2>
              <motion.div variants={container} initial="hidden" animate="show"
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {locked.map((ach) => (
                  <motion.div key={ach.id} variants={item}
                    className="glass rounded-2xl p-4 border border-gray-100 text-center opacity-60 grayscale">
                    <div className="text-4xl mb-2">{ach.icon}</div>
                    <p className="font-semibold text-gray-700 text-sm leading-tight">{ach.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{ach.description}</p>
                    <p className="text-[10px] text-gray-400 mt-2">
                      {ach.condition_value} {CONDITION_LABELS[ach.condition_type] ?? ''}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </section>
          )}

          {!achievements?.length && (
            <div className="text-center py-20 text-gray-400">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Досягнення завантажуються…</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

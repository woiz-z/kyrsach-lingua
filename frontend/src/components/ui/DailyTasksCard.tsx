import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';
import api from '../../services/api';
import type { DailyTask } from '../../types';

const TASK_TYPE_COLORS: Record<string, string> = {
  complete_lessons: 'bg-primary-500',
  vocab_review: 'bg-emerald-500',
  chat_messages: 'bg-violet-500',
};

export default function DailyTasksCard() {
  const { data: tasks, isLoading } = useQuery<DailyTask[]>({
    queryKey: ['daily-tasks'],
    queryFn: () => api.get('/daily-tasks/').then((r) => r.data),
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-6 border border-white/20 flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const completed = tasks?.filter((t) => t.completed).length ?? 0;
  const total = tasks?.length ?? 0;

  return (
    <div className="glass rounded-2xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-900">Щоденні завдання</h3>
          <p className="text-sm text-gray-500">{completed} / {total} виконано</p>
        </div>
        <span className="text-2xl">{completed === total && total > 0 ? '🎉' : '📋'}</span>
      </div>

      <div className="space-y-3">
        {tasks?.map((task) => (
          <div key={task.id} className="flex items-center gap-3">
            <span className="text-xl w-7 text-center">{task.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-medium truncate ${task.completed ? 'text-gray-400 dark:text-gray-600 line-through' : 'text-gray-800 dark:text-gray-200'}`}>
                  {task.title}
                </span>
                <span className="text-xs text-gray-400 ml-2 shrink-0">
                  {task.progress}/{task.target_count}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/8 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${TASK_TYPE_COLORS[task.task_type] ?? 'bg-primary-500'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${task.target_count > 0 ? (task.progress / task.target_count) * 100 : 0}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
            </div>
            {task.completed && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
          </div>
        ))}
      </div>

      {completed === total && total > 0 && (
        <p className="mt-4 text-center text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
          Всі завдання виконано! +{tasks?.reduce((s, t) => s + t.xp_reward, 0)} XP 🎊
        </p>
      )}
    </div>
  );
}

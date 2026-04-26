import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Sparkles,
  Star,
  ArrowLeft,
  Clock,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import api from '../services/api';
import type {
  Course,
  GenerationApproveResponse,
  GenerationJob,
  GenerationJobsListResponse,
  GenerationPreview,
  GenerationUsageStats,
  Lesson,
  UserProgress,
} from '../types';
import { toast } from '../components/ui/Toast';
import { LessonCardSkeleton } from '../components/ui/Skeleton';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35 } },
};

const LESSON_TYPE_LABELS: Record<string, string> = {
  grammar: 'Граматика',
  vocabulary: 'Лексика',
  reading: 'Читання',
  listening: 'Аудіювання',
  conversation: 'Розмовна',
};

export default function CoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [topic, setTopic] = useState('');
  const [lessonType, setLessonType] = useState('grammar');
  const [exercisesCount, setExercisesCount] = useState(8);
  const [activeJob, setActiveJob] = useState<GenerationJob | null>(null);

  const { data: course } = useQuery<Course>({
    queryKey: ['course', courseId],
    queryFn: () => api.get(`/courses/${courseId}`).then((r) => r.data),
    enabled: !!courseId,
  });

  const { data: lessons, isLoading } = useQuery<Lesson[]>({
    queryKey: ['lessons', courseId],
    queryFn: () => api.get(`/courses/${courseId}/lessons`).then((r) => r.data),
  });

  const { data: progressList } = useQuery<UserProgress[]>({
    queryKey: ['user-lesson-progress'],
    queryFn: () => api.get('/progress').then((r) => r.data),
    staleTime: 30 * 1000,
  });

  const completedLessonIds = new Set(
    (progressList ?? []).filter((p) => p.completed).map((p) => p.lesson_id),
  );

  const completedLessonsCount = (lessons ?? []).filter((lesson) => completedLessonIds.has(lesson.id)).length;

  const { data: usageStats } = useQuery<GenerationUsageStats>({
    queryKey: ['generation-usage'],
    queryFn: () => api.get('/generation/usage/stats').then((r) => r.data),
  });

  const { data: jobsList } = useQuery<GenerationJobsListResponse>({
    queryKey: ['generation-jobs'],
    queryFn: () => api.get('/generation/jobs').then((r) => r.data),
  });

  const previewQuery = useQuery<GenerationPreview>({
    queryKey: ['generation-preview', activeJob?.id],
    queryFn: () =>
      api
        .get(`/generation/jobs/${activeJob?.id}/preview`)
        .then((r) => r.data),
    enabled: !!activeJob && activeJob.status === 'draft_ready',
    retry: false,
  });

  const generateDraftMutation = useMutation({
    mutationFn: (data: {
      topic: string;
      lesson_type: string;
      exercises_count: number;
    }) =>
      api
        .post('/generation/lessons/draft', {
          course_id: Number(courseId),
          topic: data.topic,
          lesson_type: data.lesson_type,
          exercises_count: data.exercises_count,
        })
        .then((r) => r.data as GenerationJob),
    onSuccess: (job) => {
      setActiveJob(job);
      qc.invalidateQueries({ queryKey: ['generation-preview', job.id] });
      toast('success', 'Чернетку створено!');
    },
    onError: () =>
      toast('error', 'Не вдалося створити чернетку'),
  });

  const approveMutation = useMutation({
    mutationFn: (jobId: number) =>
      api
        .post(`/generation/jobs/${jobId}/approve`)
        .then((r) => r.data as GenerationApproveResponse),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lessons', courseId] });
      qc.invalidateQueries({ queryKey: ['generation-jobs'] });
      qc.invalidateQueries({ queryKey: ['generation-usage'] });
      setActiveJob(null);
      toast('success', 'Урок додано до курсу!');
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: () => api.delete(`/courses/${courseId}`).then((r) => r.data as { language_id: number }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['language-courses', data.language_id] });
      qc.invalidateQueries({ queryKey: ['course', courseId] });
      qc.invalidateQueries({ queryKey: ['lessons', courseId] });
      toast('success', 'Курс видалено');
      navigate(data.language_id ? `/languages?lang=${data.language_id}` : '/languages');
    },
    onError: () => {
      toast('error', 'Не вдалося видалити курс');
    },
  });

  if (isLoading)
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-3">
        {[...Array(3)].map((_, i) => (
          <LessonCardSkeleton key={i} />
        ))}
      </div>
    );

  const JOB_STATUS_LABELS: Record<string, string> = {
    approved: 'Затверджено',
    draft_ready: 'Чернетка',
    failed: 'Помилка',
    pending: 'Обробка...',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link
          to="/languages"
          className="inline-flex items-center gap-1 text-primary-500 text-sm font-medium hover:underline mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> {'Назад до мов'}
        </Link>
        <h1 className="text-3xl font-extrabold mb-6">
          <span className="gradient-text">{'Уроки курсу'}</span>
        </h1>
        <div className="flex items-center justify-between gap-3 mb-6">
          <p className="text-sm text-gray-500">{course?.title || 'AI-згенерований курс'}</p>
          <button
            type="button"
            onClick={() => deleteCourseMutation.mutate()}
            disabled={deleteCourseMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {deleteCourseMutation.isPending ? 'Видаляємо...' : 'Видалити курс'}
          </button>
        </div>
      </motion.div>

      {/* AI Generator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-strong rounded-2xl p-5 mb-6 border border-primary-50"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">
              {'AI-генератор уроків'}
            </h2>
            <p className="text-xs text-gray-400">
              {'Створюйте уроки за допомогою AI'}
            </p>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-3 mb-3">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={'Тема уроку...'}
            className="md:col-span-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white/70 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
          />
          <select
            value={lessonType}
            onChange={(e) => setLessonType(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white/70 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
          >
            <option value="grammar">{'Граматика'}</option>
            <option value="vocabulary">{'Лексика'}</option>
            <option value="reading">{'Читання'}</option>
            <option value="listening">{'Аудіювання'}</option>
            <option value="conversation">{'Розмовна'}</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
            <label className="text-sm text-gray-500">
              {'Вправи:'}
            </label>
            <input
              type="number"
              min={1}
              max={15}
              value={exercisesCount}
              onChange={(e) =>
                setExercisesCount(Number(e.target.value) || 1)
              }
              className="w-14 px-2 py-1 rounded-lg border border-gray-200 text-center text-sm"
            />
          </div>
          <button
            onClick={() =>
              generateDraftMutation.mutate({
                topic,
                lesson_type: lessonType,
                exercises_count: exercisesCount,
              })
            }
            disabled={
              !topic.trim() ||
              generateDraftMutation.isPending ||
              !courseId
            }
            className="px-5 py-2.5 rounded-xl text-white font-semibold gradient-bg shadow-lg shadow-primary-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {generateDraftMutation.isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{' '}
                {'Генерація...'}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />{' '}
                {'Створити'}
              </>
            )}
          </button>
          {activeJob?.status === 'failed' && (
            <span className="text-sm text-red-500">
              {activeJob.error_message ||
                'Помилка генерації'}
            </span>
          )}
          {activeJob?.status === 'draft_ready' && (
            <span className="flex items-center gap-1 text-sm text-emerald-600 font-medium">
              <CheckCircle2 className="w-4 h-4" />{' '}
              {'Чернетка готова!'}
            </span>
          )}
        </div>

        {usageStats && (
          <div className="mt-4 grid sm:grid-cols-4 gap-2">
            {[
              {
                label: 'Створено',
                value: usageStats.total_jobs,
              },
              {
                label: 'Затверджено',
                value: usageStats.approved,
              },
              {
                label: 'Ліміт',
                value: `${usageStats.remaining_today}/${usageStats.daily_limit}`,
              },
              {
                label: 'Чернетки',
                value: usageStats.drafts_ready,
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl bg-white/70 border border-gray-100 px-3 py-2"
              >
                <p className="text-xs text-gray-400">{s.label}</p>
                <p className="font-bold text-gray-900">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {jobsList?.items?.length ? (
          <div className="mt-4">
            <p className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-2">
              {'Історія генерацій'}
            </p>
            <div className="space-y-1.5 max-h-48 overflow-auto pr-1">
              {jobsList.items.slice(0, 8).map((job) => (
                <div
                  key={job.id}
                  className="text-sm flex items-center justify-between bg-white/70 border border-gray-100 rounded-xl px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate">
                      #{job.id}{' '}
                      {job.topic || 'Без теми'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {job.job_type} •{' '}
                      {LESSON_TYPE_LABELS[job.lesson_type] ||
                        job.lesson_type}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      job.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-700'
                        : job.status === 'draft_ready'
                          ? 'bg-blue-100 text-blue-700'
                          : job.status === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {JOB_STATUS_LABELS[job.status] || job.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <AnimatePresence>
          {previewQuery.data && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mt-4 rounded-xl border border-primary-100 bg-primary-50/40 p-5"
            >
              <h3 className="font-bold text-gray-900 text-lg mb-1">
                {previewQuery.data.draft.title}
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                {previewQuery.data.draft.description}
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-4">
                <span className="bg-white rounded-lg px-2 py-1">
                  {'⭐'} {previewQuery.data.draft.xp_reward} XP
                </span>
                <span className="bg-white rounded-lg px-2 py-1">
                  {'\ud83d\udcda'}{' '}
                  {LESSON_TYPE_LABELS[
                    previewQuery.data.draft.lesson_type
                  ] || previewQuery.data.draft.lesson_type}
                </span>
                <span className="bg-white rounded-lg px-2 py-1">
                  {'\ud83d\udcdd'}{' '}
                  {previewQuery.data.draft.exercises.length}{' '}
                  {'вправ'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    approveMutation.mutate(previewQuery.data!.job.id)
                  }
                  disabled={approveMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold disabled:opacity-50 hover:bg-emerald-600 transition flex items-center gap-2"
                >
                  {approveMutation.isPending ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{' '}
                      {'Зберігання...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />{' '}
                      {'Затвердити'}
                    </>
                  )}
                </button>
                <button
                  onClick={() => setActiveJob(null)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold hover:bg-gray-50 transition"
                >
                  {'Скасувати'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Course progress bar */}
      {lessons && lessons.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass rounded-2xl p-4 mb-6 border border-gray-100"
        >
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-semibold text-gray-700">
              {'Прогрес курсу'}
            </span>
            <span className="text-primary-600 font-bold">
              {completedLessonsCount} / {lessons.length} {'уроків'}
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full gradient-bg rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${lessons.length > 0 ? (completedLessonsCount / lessons.length) * 100 : 0}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            />
          </div>
          {completedLessonsCount === lessons.length && lessons.length > 0 && (
            <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {'Курс повністю завершено! \ud83c\udf89'}
            </p>
          )}
        </motion.div>
      )}

      {/* Lessons list */}
      {lessons && lessons.length > 0 ? (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {lessons.map((lesson) => (
            <motion.div key={lesson.id} variants={item}>
              {(() => {
                const isCompleted = completedLessonIds.has(lesson.id);
                return (
              <Link
                to={`/lessons/${lesson.id}`}
                className={`group glass rounded-2xl p-5 flex items-center gap-4 hover:shadow-lg hover-lift transition-all border ${
                  isCompleted
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : 'border-transparent hover:border-primary-100'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg border ${
                  isCompleted
                    ? 'bg-emerald-100 text-emerald-600 border-emerald-200'
                    : 'bg-primary-50 text-primary-600 border-primary-100'
                }`}>
                  {isCompleted
                    ? <CheckCircle2 className="w-6 h-6" />
                    : lesson.order}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">
                      {lesson.title}
                    </h3>
                    <span
                      className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide border ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {isCompleted ? 'Пройдено' : 'Не пройдено'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {lesson.description}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="flex items-center gap-1 text-sm text-amber-500 font-medium">
                    <Star className="w-4 h-4" /> {lesson.xp_reward}
                  </span>
                  <span className="hidden sm:flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                    <Clock className="w-3 h-3" />{' '}
                    {LESSON_TYPE_LABELS[lesson.lesson_type] ||
                      lesson.lesson_type}
                  </span>
                  <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
                );
              })()}
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="glass rounded-2xl p-10 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">
            {'Уроків поки немає. Створіть перший за допомогою AI!'}
          </p>
        </div>
      )}
    </div>
  );
}

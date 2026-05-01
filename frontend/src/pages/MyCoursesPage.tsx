import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, ArrowRight, Zap, CheckCircle2, Clock, Plus,
  LayoutGrid, Trophy, TrendingUp, Loader2, AlertCircle, Sparkles, Trash2, X,
  Search, ChevronLeft, ChevronRight, Filter,
} from 'lucide-react';
import api from '../services/api';

interface CourseProgressSummary {
  course_id: number;
  title: string;
  description: string;
  level: string;
  language_id: number;
  language_name: string;
  language_flag: string;
  lessons_total: number;
  lessons_completed: number;
  xp_earned: number;
  last_activity: string | null;
}

interface MyCoursesPageResponse {
  items: CourseProgressSummary[];
  total: number;
  page: number;
  pages: number;
}

interface GenerationJob {
  id: number;
  job_type: string;
  status: string;
  requested_level: string;
  created_at: string;
  payload_json: {
    progress_percent?: number;
    progress_message?: string;
    lessons_total?: number;
    lessons_completed?: number;
    language_name?: string;
    language_flag?: string;
    course_title?: string;
    course_language?: string;
  } | null;
  error_message?: string | null;
}

const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/25',
  A2: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/25',
  B1: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/25',
  B2: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/25',
  C1: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/25',
  C2: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/25',
};

const LEVEL_LABELS: Record<string, string> = {
  A1: 'Початковий',
  A2: 'Елементарний',
  B1: 'Середній',
  B2: 'Вище середнього',
  C1: 'Просунутий',
  C2: 'Вільне володіння',
};

const ALL_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const PAGE_SIZE = 12;

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' });
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.38 } } };

function useDebounce<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function langHeaderClass(languageName: string): string {
  const n = languageName.toLowerCase();
  if (n.includes('english') || n.includes('англ')) return 'lang-header-en';
  if (n.includes('german') || n.includes('deutsch') || n.includes('нім')) return 'lang-header-de';
  if (n.includes('french') || n.includes('français') || n.includes('фран')) return 'lang-header-fr';
  if (n.includes('spanish') || n.includes('español') || n.includes('іспан')) return 'lang-header-es';
  if (n.includes('japan') || n.includes('японськ')) return 'lang-header-ja';
  if (n.includes('chinese') || n.includes('китайськ')) return 'lang-header-zh';
  if (n.includes('italian') || n.includes('italiano') || n.includes('італ')) return 'lang-header-it';
  if (n.includes('portugu') || n.includes('португ')) return 'lang-header-pt';
  return 'lang-header-default';
}

export default function MyCoursesPage() {
  const queryClient = useQueryClient();

  // Filters & pagination
  const [searchInput, setSearchInput] = useState('');
  const [levelFilter, setLevelFilter] = useState<string | null>(null);
  const [languageFilter, setLanguageFilter] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(searchInput);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [debouncedSearch, levelFilter, languageFilter]);

  const queryParams = {
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(levelFilter ? { level: levelFilter } : {}),
    ...(languageFilter ? { language_id: languageFilter } : {}),
    page,
    page_size: PAGE_SIZE,
  };

  const { data: coursesPage, isLoading } = useQuery<MyCoursesPageResponse>({
    queryKey: ['my-courses', queryParams],
    queryFn: () => api.get('/progress/my-courses', { params: queryParams }).then((r) => r.data),
    staleTime: 0,
  });

  const courses = coursesPage?.items ?? [];
  const totalPages = coursesPage?.pages ?? 1;
  const totalCourses = coursesPage?.total ?? 0;

  // Collect unique languages from loaded items for the filter dropdown
  const languageOptions = Array.from(
    new Map(courses.map((c) => [c.language_id, { id: c.language_id, name: c.language_name, flag: c.language_flag }])).values()
  );

  // Generation jobs polling
  const { data: jobsData } = useQuery<{ items: GenerationJob[] }>({
    queryKey: ['generation-jobs'],
    queryFn: () => api.get('/generation/jobs').then((r) => r.data),
    refetchInterval: 4000,
    staleTime: 0,
  });

  const runningJobs = (jobsData?.items ?? []).filter(
    (j) => j.job_type === 'course_generate' && j.status === 'running',
  );
  const activeGenerations = (jobsData?.items ?? []).filter(
    (j) => j.job_type === 'course_generate' && (j.status === 'running' || j.status === 'failed'),
  );

  // When any running job completes, refresh the course list
  const prevRunningIds = useRef<Set<number>>(new Set());
  useEffect(() => {
    const currentIds = new Set(runningJobs.map((j) => j.id));
    const justFinished = [...prevRunningIds.current].some((id) => !currentIds.has(id));
    if (justFinished) {
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
    }
    prevRunningIds.current = currentIds;
  }, [runningJobs, queryClient]);

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (courseId: number) => api.delete(`/courses/${courseId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      setConfirmDeleteId(null);
    },
  });

  const dismissJobMutation = useMutation({
    mutationFn: (jobId: number) => api.delete(`/generation/jobs/${jobId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generation-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
    },
  });

  // Stats across ALL pages (not just visible page) — use totalCourses but per-page aggregation where available
  const totalXp = courses.reduce((s, c) => s + c.xp_earned, 0);
  const totalCompleted = courses.reduce((s, c) => s + c.lessons_completed, 0);
  const totalLessons = courses.reduce((s, c) => s + c.lessons_total, 0);
  const finishedCourses = courses.filter((c) => c.lessons_total > 0 && c.lessons_completed >= c.lessons_total).length;

  const hasFilters = !!(debouncedSearch || levelFilter || languageFilter);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 gradient-text-animated mb-1 flex items-center gap-3">
          <LayoutGrid className="w-8 h-8 text-primary-500" />
          Мої курси
        </h1>
        <p className="text-gray-500">Всі твої курси — з прогресом і статусом</p>
      </motion.div>

      {/* Summary stats */}
      {!isLoading && totalCourses > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
        >
          {[
            { icon: LayoutGrid, label: 'Всього курсів', value: totalCourses, color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-500/10', border: 'border-primary-100 dark:border-primary-500/20' },
            { icon: CheckCircle2, label: 'Завершено', value: finishedCourses, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20' },
            { icon: BookOpen, label: 'Уроків пройдено', value: `${totalCompleted}/${totalLessons}`, color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-500/10', border: 'border-sky-100 dark:border-sky-500/20' },
            { icon: Zap, label: 'XP з курсів', value: totalXp, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-100 dark:border-amber-500/20' },
          ].map(({ icon: Icon, label, value, color, bg, border }) => (
            <div key={label} className={`glass-premium card-accent-top rounded-2xl p-4 border ${border} flex items-center gap-3`}>
              <div className={`w-9 h-9 rounded-xl ${bg} border ${border} flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="font-bold gradient-text">{value}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Active generation jobs */}
      {activeGenerations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
            Генерація {activeGenerations.length > 1 ? `${activeGenerations.length} курсів` : 'курсу'}
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {activeGenerations.map((job) => {
              const pct = job.payload_json?.progress_percent ?? 0;
              const msg = job.payload_json?.progress_message ?? 'Генеруємо курс...';
              const lessonsTotal = job.payload_json?.lessons_total ?? 0;
              const lessonsDone = job.payload_json?.lessons_completed ?? 0;
              const isFailed = job.status === 'failed';

              return (
                <div
                  key={job.id}
                  className={`glass rounded-2xl p-5 border flex flex-col gap-4 ${
                    isFailed
                      ? 'border-red-200 dark:border-red-500/30'
                      : 'border-primary-200 dark:border-primary-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <span className="text-3xl">{job.payload_json?.language_flag ?? '🌐'}</span>
                        {!isFailed && (
                          <span className="absolute -bottom-0.5 -right-1 w-4 h-4 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                            <Sparkles className="w-2.5 h-2.5 text-primary-500" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate">
                          {job.payload_json?.course_title ?? 'Новий курс'}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {job.payload_json?.language_name ?? ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                        LEVEL_COLORS[job.requested_level] ?? 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-white/8 dark:text-gray-400'
                      }`}>
                        {job.requested_level}
                      </span>
                      <button
                        onClick={() => dismissJobMutation.mutate(job.id)}
                        disabled={dismissJobMutation.isPending}
                        title={isFailed ? 'Закрити' : 'Скасувати'}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      >
                        {dismissJobMutation.isPending && dismissJobMutation.variables === job.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <X className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {isFailed ? (
                    <div className="flex items-start gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-500/10 rounded-xl p-3">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className="flex-1">{job.error_message ?? 'Сталася помилка під час генерації'}</span>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 truncate pr-2 flex items-center gap-1.5">
                            <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                            {msg}
                          </span>
                          <span className="text-xs font-bold text-primary-500 shrink-0 tabular-nums">{pct}%</span>
                        </div>
                        <div className="h-3 rounded-full bg-gray-100 dark:bg-white/8 border border-gray-200 dark:border-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full gradient-bg relative overflow-hidden transition-all duration-700 ease-out"
                            style={{ width: `${pct}%` }}
                          >
                            <span className="absolute inset-0 progress-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                          </div>
                        </div>
                      </div>
                      {lessonsTotal > 0 && (
                        <div className="flex items-center justify-between text-xs text-gray-400 bg-gray-50 dark:bg-white/5 rounded-xl px-3 py-2">
                          <span>Уроків згенеровано</span>
                          <span className="font-bold tabular-nums">{lessonsDone} / {lessonsTotal}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Search + Filters */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6 space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Пошук за назвою або мовою..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-gray-100 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/40 focus:border-primary-400 transition-all"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full text-gray-400 hover:text-gray-600 flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Level chips + language filter row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-gray-400 font-medium">
            <Filter className="w-3.5 h-3.5" /> Рівень:
          </span>
          {ALL_LEVELS.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(levelFilter === lvl ? null : lvl)}
              className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-all ${
                levelFilter === lvl
                  ? (LEVEL_COLORS[lvl] ?? 'bg-primary-100 text-primary-700 border-primary-200')
                  : 'bg-white dark:bg-white/5 text-gray-500 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
              }`}
            >
              {lvl}
            </button>
          ))}

          {languageOptions.length > 1 && (
            <select
              value={languageFilter ?? ''}
              onChange={(e) => setLanguageFilter(e.target.value ? Number(e.target.value) : null)}
              className="ml-auto text-xs border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-primary-400/40 cursor-pointer"
            >
              <option value="">Всі мови</option>
              {languageOptions.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          )}

          {hasFilters && (
            <button
              onClick={() => { setSearchInput(''); setLevelFilter(null); setLanguageFilter(null); }}
              className="text-xs text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1 ml-1"
            >
              <X className="w-3 h-3" /> Скинути
            </button>
          )}
        </div>
      </motion.div>

      {/* Course list */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 animate-pulse h-44" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        activeGenerations.length > 0 && !hasFilters ? null : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-14 text-center border border-white/20"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-primary-400" />
            </div>
            {hasFilters ? (
              <>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Нічого не знайдено</h3>
                <p className="text-gray-500 text-sm mb-4">Спробуй змінити фільтри або пошуковий запит</p>
                <button
                  onClick={() => { setSearchInput(''); setLevelFilter(null); setLanguageFilter(null); }}
                  className="text-sm text-primary-500 hover:text-primary-600 font-medium"
                >
                  Скинути фільтри
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Ще немає курсів</h3>
                <p className="text-gray-500 text-sm mb-6">Почни навчання — обери мову та згенеруй перший курс за допомогою AI</p>
                <Link
                  to="/languages"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold gradient-bg shadow-lg shadow-primary-500/25 hover:shadow-primary-500/35 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Обрати мову
                </Link>
              </>
            )}
          </motion.div>
        )
      ) : (
        <>
          <motion.div variants={container} initial="hidden" animate="show" className="grid sm:grid-cols-2 gap-4">
            {courses.map((course) => {
              const pct = course.lessons_total > 0
                ? Math.round((course.lessons_completed / course.lessons_total) * 100)
                : 0;
              const finished = course.lessons_total > 0 && course.lessons_completed >= course.lessons_total;
              const isConfirming = confirmDeleteId === course.course_id;
              const isDeleting = deleteMutation.isPending && confirmDeleteId === course.course_id;

              return (
                <motion.div
                  key={course.course_id}
                  variants={item}
                  className="relative"
                  onMouseEnter={() => setHoveredCard(course.course_id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <Link
                    to={`/courses/${course.course_id}`}
                    className="group glass rounded-2xl p-5 border border-white/20 hover:border-primary-200 dark:hover:border-primary-500/30 transition-all hover-lift flex flex-col gap-3 h-full block"
                  >
                    <div className={`${langHeaderClass(course.language_name)} px-5 pt-4 pb-3 -mx-5 -mt-5 mb-3 rounded-t-2xl`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-3xl shrink-0">{course.language_flag}</span>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate">{course.title}</p>
                            <p className="text-sm text-gray-500 truncate">{course.language_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${LEVEL_COLORS[course.level] ?? 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-white/8 dark:text-gray-400'}`}>
                            {course.level}
                          </span>
                          {finished && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                        </div>
                      </div>
                    </div>

                    {course.description && (
                      <p className="text-xs text-gray-500 line-clamp-2">{course.description}</p>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">
                          {course.lessons_completed} / {course.lessons_total} уроків
                        </span>
                        <span className={`text-xs font-bold ${finished ? 'text-emerald-500' : 'text-primary-500'}`}>
                          {pct}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-white/60 dark:bg-white/8 border border-gray-100 dark:border-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${finished ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'lesson-progress-fill'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-1">
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-400" />
                          {course.xp_earned} XP
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(course.last_activity)}
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-xs font-semibold text-primary-500 group-hover:gap-2 transition-all">
                        {finished ? (
                          <><Trophy className="w-3.5 h-3.5" /> Повторити</>
                        ) : course.lessons_completed > 0 ? (
                          <>Продовжити <ArrowRight className="w-3.5 h-3.5" /></>
                        ) : (
                          <>Розпочати <ArrowRight className="w-3.5 h-3.5" /></>
                        )}
                      </span>
                    </div>

                    <div className="text-[10px] text-gray-400 -mt-1">
                      {LEVEL_LABELS[course.level] ?? course.level}
                    </div>
                  </Link>

                  {/* Delete button — shown on hover */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setConfirmDeleteId(course.course_id);
                    }}
                    className={`absolute top-3 right-3 w-7 h-7 rounded-lg bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-white/10 text-gray-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-500/40 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center transition-all ${
                      hoveredCard === course.course_id ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                    title="Видалити курс"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <AnimatePresence>
                    {isConfirming && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 rounded-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-red-200 dark:border-red-500/30 flex flex-col items-center justify-center gap-4 p-6 z-10"
                      >
                        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 flex items-center justify-center">
                          <Trash2 className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-gray-900 text-sm">Видалити курс?</p>
                          <p className="text-xs text-gray-500 mt-1">
                            «{course.title}» та весь прогрес буде видалено назавжди
                          </p>
                        </div>
                        <div className="flex items-center gap-2 w-full">
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" /> Скасувати
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(course.course_id); }}
                            disabled={isDeleting}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors disabled:opacity-60"
                          >
                            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            Видалити
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}

            {/* Add new course card */}
            {!hasFilters && (
              <motion.div variants={item}>
                <Link
                  to="/languages"
                  className="group glass rounded-2xl p-5 border border-dashed border-gray-200 dark:border-white/10 hover:border-primary-300 dark:hover:border-primary-500/40 transition-all hover-lift flex flex-col items-center justify-center gap-3 min-h-[180px] text-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="w-6 h-6 text-primary-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Додати курс</p>
                    <p className="text-xs text-gray-400">Обрати нову мову або рівень</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-semibold text-primary-500">
                    <TrendingUp className="w-3.5 h-3.5" /> Почати вивчення
                  </span>
                </Link>
              </motion.div>
            )}
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2 mt-8"
            >
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-9 h-9 rounded-xl border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:pointer-events-none transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-xl border text-sm font-semibold transition-all ${
                    p === page
                      ? 'gradient-bg text-white border-transparent shadow-md shadow-primary-500/25'
                      : 'border-gray-200 dark:border-white/10 text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-9 h-9 rounded-xl border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:pointer-events-none transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronRight, AlertCircle, Search, Sparkles, GraduationCap, Layers, Trash2 } from 'lucide-react';
import api from '../services/api';
import { FlagDisplay } from '../components/FlagDisplay';
import type { Language, Course, GenerationJob } from '../types';
import { toast } from '../components/ui/Toast';
import { useAuthStore } from '../store/authStore';

const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  A2: 'bg-blue-100 text-blue-700 border-blue-200',
  B1: 'bg-purple-100 text-purple-700 border-purple-200',
  B2: 'bg-orange-100 text-orange-700 border-orange-200',
};

const COURSE_LANGUAGE_OPTIONS = ['Українська', 'English', 'Polski', 'Deutsch', 'Français', 'Español'];

const resolveCourseLanguage = (nativeLanguage?: string | null): string => {
  const normalized = (nativeLanguage || '').trim().toLowerCase();
  if (['uk', 'ua', 'ukrainian', 'українська', 'украинский'].includes(normalized)) return 'Українська';
  if (['en', 'english', 'англійська', 'английский'].includes(normalized)) return 'English';
  if (['pl', 'polish', 'polski', 'польська', 'польский'].includes(normalized)) return 'Polski';
  if (['de', 'german', 'deutsch', 'німецька', 'немецкий'].includes(normalized)) return 'Deutsch';
  if (['fr', 'french', 'français', 'французька', 'французский'].includes(normalized)) return 'Français';
  if (['es', 'spanish', 'español', 'іспанська', 'испанский'].includes(normalized)) return 'Español';
  return 'Українська';
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function LanguagesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const qc = useQueryClient();
  const preselectedLangId = Number(searchParams.get('lang'));
  const hasPreselectedLang = Number.isInteger(preselectedLangId) && preselectedLangId > 0;
  const [selectedLangId, setSelectedLangId] = useState<number | null>(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseFocus, setCourseFocus] = useState('');
  const [courseLevel, setCourseLevel] = useState('A1');
  const [courseLanguage, setCourseLanguage] = useState(() => resolveCourseLanguage(user?.native_language));
  const [lessonsCount, setLessonsCount] = useState(6);
  const [exercisesPerLesson, setExercisesPerLesson] = useState(8);
  const [languageSearch, setLanguageSearch] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationElapsedSec, setGenerationElapsedSec] = useState(0);
  const [activeCourseJobId, setActiveCourseJobId] = useState<number | null>(null);
  const [handledCourseJobId, setHandledCourseJobId] = useState<number | null>(null);
  const coursesSectionRef = useRef<HTMLDivElement | null>(null);

  const {
    data: languages,
    isLoading: langsLoading,
    isError: langsError,
  } = useQuery<Language[]>({
    queryKey: ['languages'],
    queryFn: async () => {
      const response = await api.get('/languages/');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: courses, isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ['language-courses', selectedLangId],
    queryFn: async () => {
      const response = await api.get(`/languages/${selectedLangId}/courses`);
      return response.data;
    },
    enabled: selectedLangId !== null,
  });

  const safeLanguages: Language[] = Array.isArray(languages) ? languages : [];
  const safeCourses: Course[] = Array.isArray(courses) ? courses : [];
  const selectedLanguage = safeLanguages.find((lang) => lang.id === selectedLangId) || null;
  const courseLanguageOptions = useMemo(() => {
    const fromApi = safeLanguages.flatMap((lang) => [lang.native_name, lang.name]);
    const seed = [...COURSE_LANGUAGE_OPTIONS, resolveCourseLanguage(user?.native_language)];
    const merged = [...seed, ...fromApi]
      .map((item) => item.trim())
      .filter(Boolean);

    const uniqueByKey = new Map<string, string>();
    for (const item of merged) {
      const key = item.toLowerCase();
      if (!uniqueByKey.has(key)) {
        uniqueByKey.set(key, item);
      }
    }

    return Array.from(uniqueByKey.values()).sort((a, b) => a.localeCompare(b, 'uk'));
  }, [safeLanguages, user?.native_language]);

  useEffect(() => {
    const fromQuery = preselectedLangId;
    if (!Number.isInteger(fromQuery) || fromQuery <= 0 || safeLanguages.length === 0) {
      return;
    }

    const exists = safeLanguages.some((lang) => lang.id === fromQuery);
    if (exists) {
      setSelectedLangId(fromQuery);
    }
  }, [preselectedLangId, safeLanguages]);

  useEffect(() => {
    if (selectedLangId === null) return;

    const rafId = window.requestAnimationFrame(() => {
      coursesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [selectedLangId]);

  useEffect(() => {
    setCourseLanguage(resolveCourseLanguage(user?.native_language));
  }, [user?.native_language]);

  const activeCourseJobQuery = useQuery<GenerationJob>({
    queryKey: ['generation-job', activeCourseJobId],
    queryFn: () => api.get(`/generation/jobs/${activeCourseJobId}`).then((r) => r.data),
    enabled: activeCourseJobId !== null,
    refetchInterval: (query) => {
      const job = query.state.data;
      if (!job) return 1500;
      return job.status === 'running' ? 1500 : false;
    },
  });

  const generateCourseMutation = useMutation({
    mutationFn: async () => {
      if (!selectedLangId) throw new Error('Language is not selected');
      const response = await api.post(`/generation/languages/${selectedLangId}/courses`, {
        title: courseTitle,
        focus: courseFocus,
        level: courseLevel,
        course_language: courseLanguage,
        lessons_count: lessonsCount,
        exercises_per_lesson: exercisesPerLesson,
      });
      return response.data as GenerationJob;
    },
    onSuccess: (job) => {
      setActiveCourseJobId(job.id);
      setHandledCourseJobId(null);
      setGenerationProgress(Number(job.payload_json?.progress_percent ?? 2));
      toast('success', 'Генерацію курсу запущено');
    },
    onError: () => {
      toast('error', 'Не вдалося згенерувати курс. Спробуйте ще раз.');
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (course: Course) => {
      await api.delete(`/courses/${course.id}`);
      return course;
    },
    onSuccess: (course) => {
      qc.invalidateQueries({ queryKey: ['language-courses', course.language_id] });
      toast('success', 'Курс видалено');
      if (course.id === Number(activeCourseJobQuery.data?.course_id)) {
        setActiveCourseJobId(null);
      }
    },
    onError: () => {
      toast('error', 'Не вдалося видалити курс');
    },
  });

  useEffect(() => {
    const job = activeCourseJobQuery.data;
    if (!job) return;

    const progressPercent = Number(job.payload_json?.progress_percent ?? 0);
    if (progressPercent > 0) {
      setGenerationProgress(progressPercent);
    }
    if (job.status === 'running') {
      return;
    }
    if (handledCourseJobId === job.id) {
      return;
    }

    setHandledCourseJobId(job.id);
    if (job.status === 'approved' && job.course_id) {
      setGenerationProgress(100);
      qc.invalidateQueries({ queryKey: ['language-courses', selectedLangId] });
      setCourseTitle('');
      setCourseFocus('');
      toast('success', 'Курс успішно згенеровано! 🎉');
      navigate(`/courses/${job.course_id}`);
      return;
    }

    if (job.status === 'failed') {
      toast('error', job.error_message || 'Генерація курсу завершилась помилкою');
    }
  }, [activeCourseJobQuery.data, handledCourseJobId, navigate, qc, selectedLangId]);

  useEffect(() => {
    const isGenerating = generateCourseMutation.isPending || activeCourseJobQuery.data?.status === 'running';
    if (!isGenerating) {
      setGenerationProgress(0);
      setGenerationElapsedSec(0);
      return;
    }

    const startedAt = Date.now();
    const estimatedSeconds = Math.max(20, lessonsCount * 9);
    setGenerationProgress(3);
    setGenerationElapsedSec(0);

    const timerId = window.setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - startedAt) / 1000);
      setGenerationElapsedSec(elapsedSec);
      setGenerationProgress((prev) => {
        const jobProgress = Number(activeCourseJobQuery.data?.payload_json?.progress_percent ?? 0);
        if (jobProgress > prev) return jobProgress;
        const ratio = Math.min(elapsedSec / estimatedSeconds, 1);
        const target = Math.min(95, Math.round(5 + ratio * 90));
        if (target <= prev) return prev;
        return Math.min(95, prev + Math.max(1, Math.ceil((target - prev) * 0.35)));
      });
    }, 700);

    return () => window.clearInterval(timerId);
  }, [activeCourseJobQuery.data?.payload_json, activeCourseJobQuery.data?.status, generateCourseMutation.isPending, lessonsCount]);

  const generationStage = useMemo(() => {
    const jobMessage = activeCourseJobQuery.data?.payload_json?.progress_message;
    if (typeof jobMessage === 'string' && jobMessage.trim()) {
      return jobMessage;
    }
    if (generationProgress < 25) return 'Плануємо структуру курсу';
    if (generationProgress < 55) return 'Генеруємо уроки та теорію';
    if (generationProgress < 85) return 'Створюємо вправи та перевіряємо контент';
    return 'Фіналізуємо курс і зберігаємо результат';
  }, [activeCourseJobQuery.data?.payload_json, generationProgress]);

  const filteredLanguages = safeLanguages.filter((lang) => {
    const q = languageSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      lang.name.toLowerCase().includes(q)
      || lang.native_name.toLowerCase().includes(q)
      || lang.code.toLowerCase().includes(q)
    );
  });

  if (langsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Завантажуємо мови...</p>
      </div>
    );
  }

  if (langsError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="glass rounded-2xl p-10">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">Не вдалося завантажити мови. Перевірте підключення або увійдіть знову.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-5 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition"
          >
            Увійти
          </button>
        </div>
      </div>
    );
  }

  const handleSelectLanguage = (langId: number) => {
    setSelectedLangId(langId);
    setSearchParams({ lang: String(langId) });
  };

  const handleClearSelectedLanguage = () => {
    setSelectedLangId(null);
    setSearchParams({});
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Оберіть мову</h1>
        <p className="text-gray-500 mb-8">
          {hasPreselectedLang ? 'Генерація курсу для вибраної мови' : 'Виберіть мову для вивчення та оберіть курс'}
        </p>
      </motion.div>

      {hasPreselectedLang && selectedLanguage && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 glass rounded-2xl p-4 flex items-center justify-between gap-3 border border-primary-100">
          <div className="flex items-center gap-3">
            <FlagDisplay emoji={selectedLanguage.flag_emoji} heightClass="h-8" textClass="text-3xl" />
            <div>
              <p className="font-semibold text-gray-900">{selectedLanguage.name}</p>
              <p className="text-sm text-gray-500">{selectedLanguage.native_name}</p>
            </div>
          </div>
          <button
            onClick={handleClearSelectedLanguage}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
          >
            Змінити мову
          </button>
        </motion.div>
      )}

      {!hasPreselectedLang && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={languageSearch}
              onChange={(e) => setLanguageSearch(e.target.value)}
              placeholder="Пошук мови (назва / native / code)"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white/70 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
            />
          </div>
          <span className="text-sm text-gray-400 font-medium">{filteredLanguages.length} / {safeLanguages.length}</span>
        </div>
      )}

      {safeLanguages.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <p className="text-gray-400">Мови не знайдено.</p>
        </div>
      ) : !hasPreselectedLang ? (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-10 max-h-[540px] overflow-auto pr-1">
          {filteredLanguages.map((lang) => (
            <motion.button
              key={lang.id}
              variants={item}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelectLanguage(lang.id)}
              className={`glass rounded-2xl p-5 text-left transition-all duration-200 border-2 hover-lift ${
                selectedLangId === lang.id
                  ? 'border-primary-400 shadow-lg shadow-primary-500/10 bg-primary-50/30'
                  : 'border-transparent hover:border-gray-200'
              }`}
            >
              <div className="mb-2 flex items-center justify-start"><FlagDisplay emoji={lang.flag_emoji} heightClass="h-8" textClass="text-4xl" /></div>
              <div className="font-bold text-gray-900">{lang.name}</div>
              <div className="text-sm text-gray-500">{lang.native_name}</div>
            </motion.button>
          ))}
        </motion.div>
      ) : null}

      <AnimatePresence>
        {selectedLangId !== null && (
          <motion.div
            ref={coursesSectionRef}
            id="courses-section"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Layers className="w-6 h-6 text-primary-500" />
              Курси
            </h2>

            {/* AI Course Generator */}
            <div className="glass-strong rounded-2xl p-5 mb-6 border border-primary-50">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">AI-генерація курсу</p>
                  <p className="text-xs text-gray-400">Створіть повноцінний курс за допомогою AI</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <input
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="Назва курсу"
                  className="sm:col-span-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white/70 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                />
                <div className="rounded-xl border border-gray-200 bg-white/70 px-3 py-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Рівень</label>
                  <select
                    value={courseLevel}
                    onChange={(e) => setCourseLevel(e.target.value)}
                    className="w-full bg-transparent outline-none text-gray-800"
                    aria-label="Рівень курсу"
                  >
                    {(['A1', 'A2', 'B1', 'B2', 'C1', 'C2', ...(selectedLanguage?.code === 'ar' ? ['C4'] : [])] as string[]).map((l) => {
                      const labels: Record<string, string> = { A1: 'Початковий', A2: 'Елементарний', B1: 'Середній', B2: 'Вище середнього', C1: 'Просунутий', C2: 'Вільне володіння', C4: 'Майстерність' };
                      return <option key={l} value={l}>{l} — {labels[l] ?? l}</option>;
                    })}
                  </select>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white/70 px-3 py-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Мова пояснень</label>
                  <select
                    value={courseLanguage}
                    onChange={(e) => setCourseLanguage(e.target.value)}
                    className="w-full bg-transparent outline-none text-gray-800"
                    aria-label="Мова пояснень курсу"
                  >
                    <option value="" disabled>Оберіть мову пояснень курсу</option>
                    {courseLanguageOptions.map((lang) => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>
                <textarea
                  value={courseFocus}
                  onChange={(e) => setCourseFocus(e.target.value)}
                  placeholder="Фокус курсу (що саме вивчати, наприклад: Business English, подорожі, граматика часів)"
                  rows={2}
                  className="sm:col-span-2 md:col-span-4 px-4 py-2.5 rounded-xl border border-gray-200 bg-white/70 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none resize-none transition-all"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <label className="text-sm text-gray-500">Уроків:</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={lessonsCount}
                    onChange={(e) => setLessonsCount(Number(e.target.value) || 1)}
                    className="w-14 px-2 py-1 rounded-lg border border-gray-200 text-center text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <label className="text-sm text-gray-500">Вправ/урок:</label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={exercisesPerLesson}
                    onChange={(e) => setExercisesPerLesson(Number(e.target.value) || 1)}
                    className="w-14 px-2 py-1 rounded-lg border border-gray-200 text-center text-sm"
                  />
                </div>
                <button
                  onClick={() => generateCourseMutation.mutate()}
                  disabled={!courseTitle.trim() || !courseFocus.trim() || !courseLanguage.trim() || generateCourseMutation.isPending || activeCourseJobQuery.data?.status === 'running'}
                  className="px-5 py-2.5 rounded-xl text-white font-semibold gradient-bg shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {generateCourseMutation.isPending || activeCourseJobQuery.data?.status === 'running' ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Генеруємо курс...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Згенерувати курс
                    </>
                  )}
                </button>
              </div>
              {(generateCourseMutation.isPending || activeCourseJobQuery.data?.status === 'running') && (
                <div className="mt-4 rounded-xl border border-primary-200 dark:border-primary-500/25 bg-primary-50/50 dark:bg-primary-500/8 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-semibold text-gray-700">{generationStage}</p>
                    <p className="text-sm font-bold text-primary-600">{generationProgress}%</p>
                  </div>
                  <div className="h-2 rounded-full bg-white/80 dark:bg-white/8 border border-primary-100 dark:border-white/10 overflow-hidden">
                    <div
                      className="h-full gradient-bg transition-all duration-700"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Час очікування: {generationElapsedSec} c. Job #{activeCourseJobQuery.data?.id ?? '...'} {typeof activeCourseJobQuery.data?.payload_json?.lessons_completed === 'number' ? `• уроків готово: ${String(activeCourseJobQuery.data.payload_json.lessons_completed)}/${String(activeCourseJobQuery.data.payload_json.lessons_total ?? lessonsCount)}` : ''}
                  </p>
                </div>
              )}
            </div>

            {coursesLoading ? (
              <div className="flex items-center gap-2 py-4">
                <div className="w-5 h-5 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
                <span className="text-sm text-gray-400">Завантажуємо курси...</span>
              </div>
            ) : safeCourses.length === 0 ? (
              <div className="glass rounded-2xl p-10 text-center">
                <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">Курсів ще немає. Створіть AI-курс у формі вище.</p>
              </div>
            ) : (
              <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {safeCourses.map((course) => (
                  <motion.div
                    key={course.id}
                    variants={item}
                    className="glass rounded-2xl p-5 text-left hover:shadow-xl hover-lift transition-all border border-transparent hover:border-primary-100"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                            LEVEL_COLORS[course.level] ?? 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}
                        >
                          {course.level}
                        </span>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            deleteCourseMutation.mutate(course);
                          }}
                          disabled={deleteCourseMutation.isPending}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Видалити
                        </button>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/courses/${course.id}`)}
                      className="block w-full text-left"
                    >
                      <h3 className="font-bold text-gray-900 mb-1">{course.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2">{course.description}</p>
                      <div className="mt-3 flex items-center gap-1 text-primary-500 text-sm font-medium">
                        <BookOpen className="w-4 h-4" />
                        Почати курс
                      </div>
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

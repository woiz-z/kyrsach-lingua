import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Volume2,
  Lightbulb,
  Sparkles,
  Loader2,
  Trophy,
  Zap,
  BookMarked,
  Languages,
  Clock,
  Target,
  GraduationCap,
  Star,
  Shuffle,
  MessageSquare,
  ListChecks,
  PenLine,
  ArrowLeftRight,
  ToggleLeft,
  Brain,
  Flame,
  Shield,
  RotateCcw,
} from 'lucide-react';
import api from '../services/api';
import type { Lesson, Course, Exercise, ExerciseResult } from '../types';
import { toast } from '../components/ui/Toast';
import { useTTS } from '../hooks/useTTS';
import { useSoundEffect } from '../hooks/useSoundEffect';
import { Confetti } from '../components/ui/Confetti';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getExerciseMeta(ex: Exercise) {
  return {
    hint: ex.hint || '',
    difficulty: ex.difficulty || 'medium',
  };
}

function getDifficultyConfig(d: string) {
  if (d === 'easy') return { label: 'Легко', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400', icon: '🟢' };
  if (d === 'hard') return { label: 'Важко', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-400', icon: '🔴' };
  return { label: 'Середньо', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-400', icon: '🟡' };
}

function getExerciseTypeConfig(type: string) {
  const map: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    multiple_choice: { label: 'Вибір відповіді', icon: <ListChecks className="w-3.5 h-3.5" />, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    fill_blank:      { label: 'Заповни пропуск',  icon: <PenLine className="w-3.5 h-3.5" />,   color: 'bg-violet-50 text-violet-700 border-violet-200' },
    translate:       { label: 'Переклад',          icon: <ArrowLeftRight className="w-3.5 h-3.5" />, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    match:           { label: "З'єднай пари",      icon: <Shuffle className="w-3.5 h-3.5" />,   color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    true_false:      { label: 'Правда/Хиба',       icon: <ToggleLeft className="w-3.5 h-3.5" />, color: 'bg-teal-50 text-teal-700 border-teal-200' },
    open_answer:     { label: 'Відкрита відповідь',icon: <MessageSquare className="w-3.5 h-3.5" />, color: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' },
    reorder_words:   { label: 'Впорядкуй слова',   icon: <Brain className="w-3.5 h-3.5" />,    color: 'bg-rose-50 text-rose-700 border-rose-200' },
  };
  return map[type] ?? { label: type, icon: <Target className="w-3.5 h-3.5" />, color: 'bg-gray-100 text-gray-600 border-gray-200' };
}

function getOptions(exercise: Exercise): string[] {
  if (!exercise.options) return [];
  if (Array.isArray(exercise.options)) return exercise.options as string[];
  const opts = exercise.options as { choices?: string[] };
  if (Array.isArray(opts.choices)) return opts.choices;
  return [];
}

function estimateReadingTime(content: LessonContent): number {
  const text = [
    content.theory ?? '',
    ...(content.examples ?? []),
    ...(content.sections ?? []).map(s => s.content),
    ...Object.values(content.vocabulary ?? {}),
  ].join(' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

// ─── Section type detection ───────────────────────────────────────────────────

function detectSectionMeta(sec: { type: string; title: string; content: string }) {
  const t = (sec.title + ' ' + sec.type).toLowerCase();
  if (t.match(/vocab|слов|word|лексик/))
    return { emoji: '📖', color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-800', badge: 'bg-violet-100 text-violet-700' };
  if (t.match(/grammar|грамат|правил|rule/))
    return { emoji: '⚙️', color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', badge: 'bg-blue-100 text-blue-700' };
  if (t.match(/example|приклад|sample/))
    return { emoji: '💡', color: 'from-amber-400 to-orange-500', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-700' };
  if (t.match(/tip|порад|note|нотатк|увага|attention/))
    return { emoji: '✨', color: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-700' };
  if (t.match(/cultur|культур|history|історі/))
    return { emoji: '🌍', color: 'from-rose-400 to-pink-500', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800', badge: 'bg-rose-100 text-rose-700' };
  if (t.match(/pronounc|вимов|sound|звук/))
    return { emoji: '🔊', color: 'from-cyan-400 to-sky-500', bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-800', badge: 'bg-cyan-100 text-cyan-700' };
  return { emoji: '📝', color: 'from-primary-500 to-indigo-600', bg: 'bg-primary-50', border: 'border-primary-200', text: 'text-primary-800', badge: 'bg-primary-100 text-primary-700' };
}

// ─── Content data types ───────────────────────────────────────────────────────

interface LessonContent {
  theory?: string;
  examples?: string[];
  vocabulary?: Record<string, string>;
  sections?: Array<{ type: string; title: string; content: string }>;
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ sec, index }: { sec: { type: string; title: string; content: string }; index: number }) {
  const meta = detectSectionMeta(sec);
  // Detect inline pairs like "word – translation" or "word → meaning"
  const lines = sec.content.split('\n').filter(Boolean);
  const isPairsLike = lines.length >= 2 && lines.every(l => /[–—→:•\-]/.test(l));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Gradient left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${meta.color} rounded-l-2xl`} />

      <div className="pl-5 pr-5 pt-4 pb-4">
        {/* Section header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className={`w-8 h-8 rounded-xl ${meta.bg} border ${meta.border} flex items-center justify-center text-base flex-shrink-0`}>
            {meta.emoji}
          </div>
          {sec.title && (
            <h3 className={`font-bold text-gray-900 text-sm leading-tight`}>{sec.title}</h3>
          )}
        </div>

        {/* Content */}
        {isPairsLike ? (
          <div className="grid gap-1.5">
            {lines.map((line, i) => {
              const parts = line.split(/\s*[–—→:]\s*/);
              if (parts.length >= 2) {
                return (
                  <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-xl ${meta.bg} border ${meta.border}`}>
                    <span className={`font-semibold text-sm ${meta.text} flex-1`}>{parts[0].replace(/^[•\-]\s*/, '')}</span>
                    <span className="text-gray-400 text-xs flex-shrink-0">→</span>
                    <span className="text-gray-700 text-sm flex-1 text-right">{parts.slice(1).join(': ')}</span>
                  </div>
                );
              }
              return <p key={i} className="text-gray-700 text-sm leading-relaxed">{line.replace(/^[•\-]\s*/, '')}</p>;
            })}
          </div>
        ) : (
          <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-line">{sec.content}</p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Theory section ───────────────────────────────────────────────────────────

function TheorySection({ content }: { content: LessonContent }) {
  const sections = content.sections ?? [];

  return (
    <div className="space-y-3">
      {sections.length > 0 ? (
        sections.map((sec, i) => <SectionCard key={i} sec={sec} index={i} />)
      ) : (
        <>
          {content.theory && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-500 to-indigo-600 rounded-l-2xl" />
              <div className="pl-5 pr-5 pt-4 pb-4">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-primary-50 border border-primary-200 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-primary-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm">Теорія</h3>
                </div>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">{content.theory}</p>
              </div>
            </motion.div>
          )}

          {content.examples && content.examples.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-orange-500 rounded-l-2xl" />
              <div className="pl-5 pr-5 pt-4 pb-4">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-base">💡</div>
                  <h3 className="font-bold text-gray-900 text-sm">Приклади</h3>
                </div>
                <div className="space-y-2">
                  {content.examples.map((ex, i) => (
                    <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-100">
                      <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-sm text-gray-800 leading-relaxed">{ex}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {content.vocabulary && Object.keys(content.vocabulary).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
              className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-500 to-purple-600 rounded-l-2xl" />
              <div className="pl-5 pr-5 pt-4 pb-4">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center text-base">📖</div>
                  <h3 className="font-bold text-gray-900 text-sm">Словниковий запас</h3>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">
                    {Object.keys(content.vocabulary).length} слів
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {Object.entries(content.vocabulary).map(([word, translation]) => (
                    <div
                      key={word}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-violet-50 border border-violet-100 hover:border-violet-300 transition-colors"
                    >
                      <span className="font-semibold text-gray-900 text-sm">{word}</span>
                      <span className="text-gray-500 text-sm">{translation}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { speak, isSupported: ttsSupported } = useTTS();
  const play = useSoundEffect();

  const [tab, setTab] = useState<'theory' | 'exercises'>('theory');
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<ExerciseResult | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [completedLesson, setCompletedLesson] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translation, setTranslation] = useState<string | null>(null);
  const [savingVocab, setSavingVocab] = useState(false);
  const [generatingMore, setGeneratingMore] = useState(false);

  const { data: lesson, isLoading: lessonLoading } = useQuery<Lesson>({
    queryKey: ['lesson', lessonId],
    queryFn: () => api.get(`/lessons/${lessonId}`).then((r) => r.data),
    enabled: !!lessonId,
  });

  const courseId = lesson?.course_id;

  const { data: course } = useQuery<Course>({
    queryKey: ['course', courseId],
    queryFn: () => api.get(`/courses/${courseId}`).then((r) => r.data),
    enabled: !!courseId,
  });

  const { data: exercises, isLoading: exercisesLoading, refetch: refetchExercises } = useQuery<Exercise[]>({
    queryKey: ['exercises', lessonId],
    queryFn: () => api.get(`/lessons/${lessonId}/exercises`).then((r) => r.data),
    enabled: !!lessonId,
  });

  const submitMutation = useMutation({
    mutationFn: (d: { exerciseId: number; answer: string }) =>
      api.post(`/exercises/${d.exerciseId}/submit`, { answer: d.answer }).then((r) => r.data as ExerciseResult),
    onSuccess: (res) => {
      setResult(res);
      if (res.is_correct) {
        play('correct');
        toast('success', 'Правильно! 🎉');
      } else {
        play('wrong');
      }
    },
    onError: () => toast('error', 'Помилка при перевірці відповіді'),
  });

  const completeMutation = useMutation({
    mutationFn: () => api.post(`/lessons/${lessonId}/complete`).then((r) => r.data),
    onSuccess: (data) => {
      const xp = (data as { xp_earned?: number }).xp_earned ?? lesson?.xp_reward ?? 0;
      setEarnedXP(xp);
      setCompletedLesson(true);
      setShowConfetti(true);
      play('complete');
      qc.invalidateQueries({ queryKey: ['progress-history'] });
      qc.invalidateQueries({ queryKey: ['progress-stats'] });
      qc.invalidateQueries({ queryKey: ['progress-streak'] });
      qc.invalidateQueries({ queryKey: ['progress-achievements'] });
      qc.invalidateQueries({ queryKey: ['user-lesson-progress'] });
      qc.invalidateQueries({ queryKey: ['daily-tasks'] });
      qc.invalidateQueries({ queryKey: ['leaderboard'] });
    },
    onError: () => toast('error', 'Помилка при завершенні уроку'),
  });

  const handleSubmit = () => {
    if (!exercise || !answer.trim() || !!result) return;
    submitMutation.mutate({ exerciseId: exercise.id, answer: answer.trim() });
  };

  const handleNext = () => {
    const list = exercises ?? [];
    setShowHint(false);
    setTranslation(null);

    if (exerciseIdx < list.length - 1) {
      setExerciseIdx((i) => i + 1);
      setAnswer('');
      setResult(null);
    } else {
      // All exercises done — complete lesson
      completeMutation.mutate();
    }
  };

  const handleTranslate = async () => {
    if (!exercise) return;
    // For translate/fill_blank the question IS the foreign word.
    // For other types (multiple_choice, true_false…) correct_answer is the foreign word.
    const isQuestionTheWord = exercise.exercise_type === 'translate' || exercise.exercise_type === 'fill_blank';
    const text = isQuestionTheWord ? exercise.question : exercise.correct_answer;
    if (!text) return;
    setTranslating(true);
    setTranslation(null);
    try {
      const langCode = course?.language?.code ?? 'en';
      const res = await api.get('/ai-tools/translate', {
        params: { word: text, source_lang: langCode, target_lang: 'uk' },
      });
      setTranslation(res.data.translation || '—');
    } catch {
      toast('error', 'Не вдалося перекласти');
    } finally {
      setTranslating(false);
    }
  };

  const handleSaveVocab = async () => {
    if (!exercise) return;
    setSavingVocab(true);
    try {
      const langCode = course?.language?.code ?? 'en';
      // For translate/fill_blank exercises, question IS the foreign word.
      // For multiple_choice and others, question is a Ukrainian instruction —
      // correct_answer is the foreign word; extract quoted text as the translation.
      const isQuestionTheWord = exercise.exercise_type === 'translate' || exercise.exercise_type === 'fill_blank';
      let vocabWord: string;
      let vocabTranslation: string;
      if (isQuestionTheWord) {
        vocabWord = exercise.question;
        vocabTranslation = exercise.correct_answer;
      } else {
        vocabWord = exercise.correct_answer;
        const quotedMatch = exercise.question.match(/[''"«»]([^''"«»]+)[''"«»]/);
        vocabTranslation = quotedMatch ? quotedMatch[1] : exercise.question;
      }
      await api.post('/vocabulary/', {
        word: vocabWord,
        translation: vocabTranslation,
        language_code: langCode,
        lesson_id: lesson?.id,
      });
      play('save');
      toast('success', 'Слово збережено у словник!');
    } catch {
      toast('error', 'Не вдалося зберегти слово');
    } finally {
      setSavingVocab(false);
    }
  };

  const handleGenerateMore = async () => {
    if (!lesson) return;
    setGeneratingMore(true);
    try {
      await api.post(`/generation/lessons/${lessonId}/exercises/on-demand`, {
        exercises_count: 3,
        topic_hint: lesson.title,
      });
      toast('success', 'Нові вправи згенеровані!');
      await refetchExercises();
    } catch {
      toast('error', 'Не вдалося згенерувати вправи');
    } finally {
      setGeneratingMore(false);
    }
  };

  const exercise = exercises?.[exerciseIdx];
  const meta = exercise ? getExerciseMeta(exercise) : null;
  const options = exercise ? getOptions(exercise) : [];
  const progress = exercises?.length ? Math.round((exerciseIdx / exercises.length) * 100) : 0;
  const isLoading = lessonLoading || exercisesLoading;

  const lessonContent = (lesson?.content ?? {}) as LessonContent;
  const readingTime = lesson ? estimateReadingTime(lessonContent) : 1;

  // ── Lesson completed overlay ──────────────────────────────────────────────
  if (completedLesson) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Confetti active={showConfetti} count={120} />
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="glass-strong rounded-3xl p-10 max-w-md w-full text-center border border-white/60 shadow-2xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 18 }}
            className="w-24 h-24 rounded-full gradient-bg flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary-500/40"
          >
            <Trophy className="w-12 h-12 text-white" />
          </motion.div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">🎉 Урок завершено!</h2>
          <p className="text-gray-500 mb-2">Чудова робота! Ви пройшли всі вправи.</p>
          {course && (
            <p className="text-sm text-gray-400 mb-6">
              {course.language?.flag_emoji} {course.language?.name} · {course.title}
            </p>
          )}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-6 mb-8 py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100"
          >
            <div className="text-center">
              <div className="flex items-center gap-1.5 justify-center">
                <Zap className="w-5 h-5 text-amber-500" />
                <span className="text-2xl font-extrabold text-amber-700">+{earnedXP}</span>
              </div>
              <p className="text-xs text-amber-600 mt-0.5">XP зароблено</p>
            </div>
            <div className="w-px h-10 bg-amber-200" />
            <div className="text-center">
              <div className="flex items-center gap-1.5 justify-center">
                <Star className="w-5 h-5 text-amber-500" />
                <span className="text-2xl font-extrabold text-amber-700">{exercises?.length ?? 0}</span>
              </div>
              <p className="text-xs text-amber-600 mt-0.5">вправ виконано</p>
            </div>
            <div className="w-px h-10 bg-amber-200" />
            <div className="text-center">
              <div className="flex items-center gap-1.5 justify-center">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="gradient-text-animated text-2xl font-extrabold">100%</span>
              </div>
              <p className="text-xs text-orange-600 mt-0.5">завершено</p>
            </div>
          </motion.div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate(`/courses/${lesson?.course_id}`)}
              className="w-full py-3 rounded-xl gradient-bg text-white font-semibold shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2 hover:shadow-primary-500/40 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> До курсу
            </button>
            <button
              onClick={() => {
                setCompletedLesson(false);
                setShowConfetti(false);
                setExerciseIdx(0);
                setAnswer('');
                setResult(null);
                setTab('theory');
              }}
              className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
            >
              Переглянути урок знову
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">Урок не знайдено.</p>
        <Link to="/my-courses" className="gradient-bg text-white px-5 py-2.5 rounded-xl font-medium">
          До курсів
        </Link>
      </div>
    );
  }

  const sectionsCount = lessonContent.sections?.length ?? 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <Confetti active={showConfetti} count={80} />

      {/* ── Back breadcrumb ── */}
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="mb-4">
        <Link
          to={`/courses/${lesson.course_id}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary-600 transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {course ? `${course.language?.flag_emoji ?? ''} ${course.title}` : 'Назад до курсу'}
        </Link>
      </motion.div>

      {/* ── Hero header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl mb-6 border border-white/60 shadow-lg"
      >
        {/* Background gradient */}
        <div className="absolute inset-0 gradient-bg-static opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18)_0%,transparent_60%)]" />

        <div className="relative px-6 pt-6 pb-5">
          {/* Top row: lesson type + XP */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-white/20 text-white/90 font-medium backdrop-blur-sm border border-white/25 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                {course?.level ?? lesson.lesson_type}
              </span>
              {course?.language && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-white/20 text-white/90 font-medium backdrop-blur-sm border border-white/25">
                  {course.language.flag_emoji} {course.language.name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
              <Zap className="w-4 h-4 text-amber-300" />
              <span className="text-sm font-extrabold text-white">+{lesson.xp_reward} XP</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-2 drop-shadow-sm">
            {lesson.title}
          </h1>
          {lesson.description && (
            <p className="text-white/75 text-sm leading-relaxed mb-4 max-w-xl">{lesson.description}</p>
          )}

          {/* Meta chips */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/15 text-white/85 border border-white/20">
              <Clock className="w-3.5 h-3.5" />
              ~{readingTime} хв читання
            </div>
            {sectionsCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/15 text-white/85 border border-white/20">
                <BookOpen className="w-3.5 h-3.5" />
                {sectionsCount} розділів
              </div>
            )}
            {exercises && exercises.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/15 text-white/85 border border-white/20">
                <Target className="w-3.5 h-3.5" />
                {exercises.length} вправ
              </div>
            )}
            {lesson.order && (
              <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/15 text-white/85 border border-white/20">
                <Shield className="w-3.5 h-3.5" />
                Урок {lesson.order}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Tabs ── */}
      <div className="flex gap-1.5 p-1.5 rounded-2xl bg-gray-100/80 mb-5 border border-gray-200/60">
        {(['theory', 'exercises'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              tab === t
                ? 'bg-white text-gray-900 shadow-sm border border-gray-100'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
            }`}
          >
            {t === 'theory' ? (
              <><BookOpen className="w-3.5 h-3.5" /> Теорія</>
            ) : (
              <><Target className="w-3.5 h-3.5" /> Вправи{exercises?.length ? <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-700 text-xs font-bold">{exercises.length}</span> : ''}</>
            )}
          </button>
        ))}
      </div>

      {/* ── Content panels ── */}
      <AnimatePresence mode="wait">
        {tab === 'theory' && (
          <motion.div
            key="theory"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.22 }}
          >
            <TheorySection content={lessonContent} />

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-5 flex items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-primary-50 to-indigo-50 border border-primary-100"
            >
              <div>
                <p className="text-sm font-semibold text-gray-800">Готові практикуватись? 💪</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {exercises?.length ? `${exercises.length} вправ на вас чекає` : 'Вправи ще не згенеровані'}
                </p>
              </div>
              {exercises?.length ? (
                <button
                  onClick={() => setTab('exercises')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-bg text-white font-semibold text-sm shadow-md shadow-primary-500/20 hover:shadow-primary-500/35 transition-all flex-shrink-0"
                >
                  До вправ <ChevronRight className="w-4 h-4" />
                </button>
              ) : !exercisesLoading ? (
                <button
                  onClick={() => completeMutation.mutate()}
                  disabled={completeMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-bg text-white font-semibold text-sm shadow-md shadow-primary-500/20 hover:shadow-primary-500/35 transition-all flex-shrink-0 disabled:opacity-50"
                >
                  {completeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
                  Завершити урок
                </button>
              ) : null}
            </motion.div>
          </motion.div>
        )}

        {/* ── Exercises tab ── */}
        {tab === 'exercises' && (
          <motion.div
            key="exercises"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.22 }}
          >
            {!exercises?.length ? (
              <div className="rounded-2xl p-10 text-center border border-dashed border-gray-200 bg-gray-50">
                <div className="w-14 h-14 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-7 h-7 text-primary-500" />
                </div>
                <p className="text-gray-600 font-medium mb-1">Вправи ще не згенеровані</p>
                <p className="text-sm text-gray-400 mb-5">AI створить персоналізовані вправи по темі уроку</p>
                <div className="flex flex-col items-center gap-3">
                  <button
                    onClick={handleGenerateMore}
                    disabled={generatingMore}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-bg text-white font-medium shadow-md shadow-primary-500/20"
                  >
                    {generatingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Згенерувати вправи
                  </button>
                  <button
                    onClick={() => completeMutation.mutate()}
                    disabled={completeMutation.isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    {completeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
                    Завершити урок (без вправ)
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Progress bar */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {exercises.map((_, i) => (
                          <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              i < exerciseIdx
                                ? 'bg-emerald-400 w-6'
                                : i === exerciseIdx
                                ? 'gradient-bg-static w-6'
                                : 'bg-gray-200 w-4'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500 font-medium">
                        {exerciseIdx + 1}/{exercises.length}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-primary-600">{progress}% ✓</span>
                  </div>
                  <div className="lesson-progress-bar">
                    <div className="lesson-progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                {/* Exercise card */}
                <AnimatePresence mode="wait">
                  {exercise && (
                    <motion.div
                      key={exercise.id}
                      initial={{ opacity: 0, y: 16, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -12, scale: 0.98 }}
                      transition={{ duration: 0.25 }}
                      className="glass-spin-border rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden mb-4"
                    >
                      {/* Exercise type header banner */}
                      {(() => {
                        const cfg = getExerciseTypeConfig(exercise.exercise_type);
                        const diff = getDifficultyConfig(meta?.difficulty ?? 'medium');
                        return (
                          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/70">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${cfg.color}`}>
                                {cfg.icon} {cfg.label}
                              </span>
                              <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${diff.color}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${diff.dot}`} />
                                {diff.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400 font-medium">{exercise.points} pts</span>
                              {ttsSupported && (
                                <button
                                  onClick={() => speak(exercise.question, course?.language?.code ?? 'en')}
                                  className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center hover:bg-primary-100 transition-colors border border-primary-100"
                                  title="Прослухати"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Question */}
                      <div className="px-5 pt-5 pb-4">
                        <p className="font-bold text-gray-900 text-lg leading-snug mb-5">{exercise.question}</p>

                        {/* Multiple choice */}
                        {exercise.exercise_type === 'multiple_choice' && options.length > 0 && (
                          <div className="grid gap-2.5 mb-4">
                            {options.map((opt, optIdx) => {
                              const isSelected = answer === opt;
                              const isCorrectAnswer = result && opt === result.correct_answer;
                              const isWrongSelected = result && isSelected && !result.is_correct;
                              const letter = String.fromCharCode(65 + optIdx);
                              return (
                                <button
                                  key={opt}
                                  disabled={!!result}
                                  onClick={() => setAnswer(opt)}
                                  className={`w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all flex items-center gap-3 ${
                                    isCorrectAnswer
                                      ? 'answer-correct border-emerald-400 bg-emerald-50 text-emerald-800'
                                      : isWrongSelected
                                      ? 'answer-wrong answer-shake border-red-400 bg-red-50 text-red-800'
                                      : isSelected
                                      ? 'border-primary-400 bg-primary-50 text-primary-800'
                                      : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50/40'
                                  }`}
                                >
                                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                    isCorrectAnswer ? 'bg-emerald-200 text-emerald-700'
                                    : isWrongSelected ? 'bg-red-200 text-red-700'
                                    : isSelected ? 'bg-primary-200 text-primary-700'
                                    : 'bg-gray-100 text-gray-500'
                                  }`}>{letter}</span>
                                  <span className="flex-1">{opt}</span>
                                  {isCorrectAnswer && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                                  {isWrongSelected && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* True/False */}
                        {exercise.exercise_type === 'true_false' && (
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            {['True', 'False'].map((opt) => {
                              const isSelected = answer === opt;
                              const isCorrectAnswer = result && opt === result.correct_answer;
                              const isWrongSelected = result && isSelected && !result.is_correct;
                              return (
                                <button
                                  key={opt}
                                  disabled={!!result}
                                  onClick={() => setAnswer(opt)}
                                  className={`py-4 rounded-xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                                    isCorrectAnswer ? 'answer-correct border-emerald-400 bg-emerald-50 text-emerald-700'
                                    : isWrongSelected ? 'answer-wrong answer-shake border-red-400 bg-red-50 text-red-700'
                                    : isSelected ? 'border-primary-400 bg-primary-50 text-primary-700'
                                    : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50/40'
                                  }`}
                                >
                                  <span>{opt === 'True' ? '✅' : '❌'}</span>
                                  {opt === 'True' ? 'Правда' : 'Хиба'}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Text input */}
                        {(exercise.exercise_type === 'translate' ||
                          exercise.exercise_type === 'fill_blank' ||
                          exercise.exercise_type === 'open_answer' ||
                          exercise.exercise_type === 'reorder_words') && (
                          <div className="mb-4">
                            <input
                              type="text"
                              value={answer}
                              onChange={(e) => setAnswer(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && !result && handleSubmit()}
                              disabled={!!result}
                              placeholder="Введіть вашу відповідь..."
                              className={`w-full px-4 py-3.5 rounded-xl border-2 text-sm outline-none transition-all ${
                                result
                                  ? result.is_correct
                                    ? 'border-emerald-400 bg-emerald-50'
                                    : 'border-red-400 bg-red-50'
                                  : 'border-gray-200 focus:border-primary-400 focus:ring-3 focus:ring-primary-100'
                              }`}
                              autoFocus
                            />
                          </div>
                        )}

                        {/* Result feedback */}
                        <AnimatePresence>
                          {result && (
                            <motion.div
                              initial={{ opacity: 0, y: 8, scale: 0.97 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              className={`mb-4 p-4 rounded-xl border ${
                                result.is_correct
                                  ? 'bg-emerald-50 border-emerald-200'
                                  : 'bg-red-50 border-red-200'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 mb-1">
                                {result.is_correct ? (
                                  <>
                                    <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-emerald-700">Правильно! 🎉</p>
                                      <p className="text-xs text-emerald-600">+{result.points_earned} балів зараховано</p>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                                      <XCircle className="w-4 h-4 text-red-600" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-red-700">Не вірно 😔</p>
                                      <p className="text-xs text-red-600">Правильна відповідь: <strong>{result.correct_answer}</strong></p>
                                    </div>
                                  </>
                                )}
                              </div>
                              {result.explanation && (
                                <p className="text-xs text-gray-600 mt-2 leading-relaxed pl-10">{result.explanation}</p>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Action row */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {!result && (
                            <button
                              onClick={handleSubmit}
                              disabled={!answer.trim() || submitMutation.isPending}
                              className="flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-bg text-white font-semibold text-sm shadow-md shadow-primary-500/25 hover:shadow-primary-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Перевірити ✓'}
                            </button>
                          )}

                          {result && (
                            <button
                              onClick={handleNext}
                              disabled={completeMutation.isPending}
                              className="flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-bg text-white font-semibold text-sm shadow-md shadow-primary-500/25 hover:shadow-primary-500/40 transition-all"
                            >
                              {completeMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : exerciseIdx < (exercises?.length ?? 0) - 1 ? (
                                <>Далі <ChevronRight className="w-4 h-4" /></>
                              ) : (
                                <>🏆 Завершити урок</>
                              )}
                            </button>
                          )}

                          {result && !result.is_correct && (
                            <button
                              onClick={() => { setResult(null); setAnswer(''); }}
                              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-orange-600 bg-orange-50 border border-orange-200 text-sm font-medium hover:bg-orange-100 transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Спробувати ще раз
                            </button>
                          )}

                          {/* Hint */}
                          {meta?.hint && !result && (
                            <button
                              onClick={() => setShowHint((v) => !v)}
                              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-amber-600 bg-amber-50 border border-amber-200 text-sm font-medium hover:bg-amber-100 transition-colors"
                            >
                              <Lightbulb className="w-3.5 h-3.5" />
                              {showHint ? 'Сховати' : 'Підказка'}
                            </button>
                          )}

                          {/* Translate */}
                          <button
                            onClick={handleTranslate}
                            disabled={translating}
                            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-violet-600 bg-violet-50 border border-violet-200 text-sm font-medium hover:bg-violet-100 transition-colors"
                          >
                            {translating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Languages className="w-3.5 h-3.5" />}
                            Перекласти
                          </button>

                          {/* Save vocab */}
                          <button
                            onClick={handleSaveVocab}
                            disabled={savingVocab}
                            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-primary-600 bg-primary-50 border border-primary-200 text-sm font-medium hover:bg-primary-100 transition-colors"
                          >
                            {savingVocab ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookMarked className="w-3.5 h-3.5" />}
                            До словника
                          </button>
                        </div>

                        {/* Hint box */}
                        <AnimatePresence>
                          {showHint && meta?.hint && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800 flex items-start gap-2">
                                <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                                <span>{meta.hint}</span>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Translation box */}
                        <AnimatePresence>
                          {translation && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 p-3.5 rounded-xl bg-violet-50 border border-violet-200 text-sm text-violet-800 flex items-start gap-2">
                                <Languages className="w-4 h-4 flex-shrink-0 mt-0.5 text-violet-500" />
                                <span>{translation}</span>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Generate more */}
                <div className="flex justify-center mt-3">
                  <button
                    onClick={handleGenerateMore}
                    disabled={generatingMore}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-primary-600 transition-colors py-2 px-4 rounded-xl hover:bg-primary-50 border border-transparent hover:border-primary-100"
                  >
                    {generatingMore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Згенерувати ще вправи
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

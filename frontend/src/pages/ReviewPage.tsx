import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Trophy,
  Loader2,
  BookOpen,
  Lightbulb,
} from 'lucide-react';
import api from '../services/api';
import { useMutation } from '@tanstack/react-query';
import type { Exercise, ExerciseResult, ReviewExercisesResponse } from '../types';
import { toast } from '../components/ui/Toast';
import { useSoundEffect } from '../hooks/useSoundEffect';
import { Confetti } from '../components/ui/Confetti';

export default function ReviewPage() {
  const play = useSoundEffect();
  const [started, setStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<ExerciseResult | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [finished, setFinished] = useState(false);

  const { data, isLoading, refetch } = useQuery<ReviewExercisesResponse>({
    queryKey: ['review-exercises'],
    queryFn: () => api.get('/progress/review/exercises?count=10').then((r) => r.data),
    enabled: started,
    staleTime: 0,
  });

  const exercises = data?.exercises ?? [];
  const total = exercises.length;
  const exercise = exercises[currentIdx] as Exercise | undefined;

  const submitMutation = useMutation({
    mutationFn: (d: { exerciseId: number; answer: string }) =>
      api.post(`/exercises/${d.exerciseId}/submit`, { answer: d.answer }).then((r) => r.data as ExerciseResult),
    onSuccess: (res) => {
      setResult(res);
      setTotalPoints((p) => p + res.points_earned);
      if (res.is_correct) {
        setCorrectCount((c) => c + 1);
        play('correct');
        toast('success', 'Правильно! 🎉');
      } else {
        play('wrong');
      }
    },
    onError: () => toast('error', 'Помилка при перевірці'),
  });

  const handleSubmit = () => {
    if (!exercise || !answer.trim()) return;
    submitMutation.mutate({ exerciseId: exercise.id, answer: answer.trim() });
  };

  const handleNext = () => {
    if (currentIdx < total - 1) {
      setCurrentIdx((i) => i + 1);
      setAnswer('');
      setResult(null);
    } else {
      play('complete');
      setFinished(true);
    }
  };

  const handleRestart = () => {
    setStarted(false);
    setCurrentIdx(0);
    setAnswer('');
    setResult(null);
    setCorrectCount(0);
    setTotalPoints(0);
    setFinished(false);
    setTimeout(() => {
      setStarted(true);
      refetch();
    }, 100);
  };

  const getOptions = (ex: Exercise): string[] => {
    if (Array.isArray(ex.options)) return ex.options;
    if (ex.options && typeof ex.options === 'object' && 'choices' in ex.options && Array.isArray(ex.options.choices)) {
      return ex.options.choices;
    }
    return [];
  };

  const progress = total > 0 ? ((currentIdx + (result ? 1 : 0)) / total) * 100 : 0;

  if (!started) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-20 h-20 rounded-3xl gradient-bg flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary-500/30">
            <RotateCcw className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Швидке повторення</h1>
          <p className="text-gray-500 mb-8">
            10 випадкових вправ з ваших пройдених уроків. Перевірте знання!
          </p>
          <button
            onClick={() => setStarted(true)}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-bold text-lg gradient-bg shadow-xl shadow-primary-500/30 hover:shadow-primary-500/45 transition-all hover:scale-105"
          >
            Почати <ArrowRight className="w-5 h-5" />
          </button>
          <div className="mt-6">
            <Link to="/dashboard" className="text-sm text-gray-400 hover:text-gray-600 transition">
              ← Назад на головну
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-4">
        <div className="h-4 skeleton rounded-full w-full" />
        <div className="h-64 skeleton rounded-2xl" />
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <BookOpen className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Немає вправ для повторення</h2>
        <p className="text-gray-500 mb-6">Пройдіть кілька уроків, щоб накопичити матеріал для повторення.</p>
        <Link to="/languages" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold gradient-bg shadow-lg shadow-primary-500/20">
          До уроків <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Confetti active={finished} />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="glass-strong rounded-2xl p-10 text-center border border-amber-100 bg-gradient-to-b from-amber-50/50 to-white"
        >
          <motion.div
            initial={{ rotate: -10, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
          >
            <Trophy className="w-20 h-20 text-amber-500 mx-auto mb-5" />
          </motion.div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Повторення завершено! 🎉</h2>
          <div className="flex items-center justify-center gap-6 my-5">
            <div className="text-center">
              <p className="text-3xl font-extrabold text-amber-600">{totalPoints}</p>
              <p className="text-sm text-gray-500">XP</p>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div className="text-center">
              <p className="text-3xl font-extrabold text-emerald-600">{correctCount}/{total}</p>
              <p className="text-sm text-gray-500">правильних</p>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div className="text-center">
              <p className="text-3xl font-extrabold text-primary-600">
                {total > 0 ? Math.round((correctCount / total) * 100) : 0}%
              </p>
              <p className="text-sm text-gray-500">точність</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <button
              onClick={handleRestart}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold gradient-bg shadow-lg shadow-primary-500/25 hover:shadow-primary-500/35 transition-all"
            >
              <RotateCcw className="w-4 h-4" /> Ще раз
            </button>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
            >
              На головну
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-500 font-medium">Вправа {currentIdx + 1} / {total}</span>
          <span className="text-primary-600 font-bold">{Math.round(progress)}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full gradient-bg rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1.5 text-right">
          ✓ {correctCount} правильних
        </p>
      </div>

      {/* Exercise card */}
      {exercise && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="glass-strong rounded-2xl p-6 sm:p-8 border border-gray-100"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6 leading-snug">
              {exercise.question}
            </h2>

            {!result ? (
              <>
                {(() => {
                  const options = getOptions(exercise);
                  if (options.length > 0) {
                    return (
                      <div className="space-y-2.5 mb-5">
                        {options.map((opt, i) => (
                          <button
                            key={i}
                            onClick={() => setAnswer(opt)}
                            className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all text-sm font-medium ${
                              answer === opt
                                ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm ring-2 ring-primary-100'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-xs font-bold mr-3 text-gray-500">
                              {String.fromCharCode(65 + i)}
                            </span>
                            {opt}
                          </button>
                        ))}
                      </div>
                    );
                  }
                  return (
                    <input
                      type="text"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                      placeholder="Ваша відповідь..."
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white/60 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all mb-5 text-lg"
                    />
                  );
                })()}
                <button
                  onClick={handleSubmit}
                  disabled={!answer.trim() || submitMutation.isPending}
                  className="px-6 py-3 rounded-xl text-white font-semibold gradient-bg shadow-lg shadow-primary-500/25 disabled:opacity-50 hover:shadow-primary-500/35 transition-all flex items-center gap-2"
                >
                  {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Перевірити
                </button>
              </>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <div
                  className={`flex items-center gap-3 p-4 rounded-xl mb-4 border ${
                    result.is_correct
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  {result.is_correct ? (
                    <CheckCircle2 className="w-6 h-6 shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="font-bold">
                      {result.is_correct ? 'Правильно! 🎉' : 'Неправильно'}
                    </p>
                    {!result.is_correct && (
                      <p className="text-sm mt-0.5">
                        Правильна відповідь: <span className="font-bold">{result.correct_answer}</span>
                      </p>
                    )}
                  </div>
                  {result.is_correct && (
                    <span className="font-bold text-lg">+{result.points_earned}</span>
                  )}
                </div>
                {result.explanation && (
                  <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700 mb-4 border border-blue-100 flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 mt-0.5 shrink-0 text-blue-400" />
                    <span>{result.explanation}</span>
                  </div>
                )}
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold gradient-bg shadow-lg shadow-primary-500/25 hover:shadow-primary-500/35 transition-all"
                >
                  {currentIdx < total - 1 ? 'Наступна' : 'Завершити'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

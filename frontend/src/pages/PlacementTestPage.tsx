import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Loader2, CheckCircle2, XCircle, ChevronRight, RefreshCw } from 'lucide-react';
import api from '../services/api';
import type {
  Language,
  PlacementQuestion,
  PlacementTestGenerateResponse,
  PlacementTestResult,
} from '../types';
import { toast } from '../components/ui/Toast';

const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  A2: 'bg-teal-100 text-teal-700 border-teal-200',
  B1: 'bg-blue-100 text-blue-700 border-blue-200',
  B2: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  C1: 'bg-violet-100 text-violet-700 border-violet-200',
  'C1+': 'bg-amber-100 text-amber-700 border-amber-200',
};

type Phase = 'pick-language' | 'testing' | 'result';

export default function PlacementTestPage() {
  const [phase, setPhase] = useState<Phase>('pick-language');
  const [selectedLang, setSelectedLang] = useState('');
  const [langSearch, setLangSearch] = useState('');
  const [questions, setQuestions] = useState<PlacementQuestion[]>([]);
  const [languageName, setLanguageName] = useState('');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [result, setResult] = useState<PlacementTestResult | null>(null);

  const { data: languages } = useQuery<Language[]>({
    queryKey: ['languages'],
    queryFn: () => api.get('/languages').then((r) => r.data),
  });

  const generateMutation = useMutation({
    mutationFn: (language_code: string) =>
      api.post('/placement-test/generate', { language_code }).then((r) => r.data as PlacementTestGenerateResponse),
    onSuccess: (data) => {
      setQuestions(data.questions);
      setLanguageName(data.language_name);
      setAnswers([]);
      setCurrentQ(0);
      setSelectedOption(null);
      setPhase('testing');
    },
    onError: () => toast('error', 'Не вдалося згенерувати тест'),
  });

  const evaluateMutation = useMutation({
    mutationFn: (finalAnswers: string[]) =>
      api.post('/placement-test/evaluate', {
        language_code: selectedLang,
        questions,
        answers: finalAnswers,
      }).then((r) => r.data as PlacementTestResult),
    onSuccess: (data) => {
      setResult(data);
      setPhase('result');
    },
    onError: () => toast('error', 'Не вдалося оцінити відповіді'),
  });

  const handleSelectOption = (opt: string) => {
    if (selectedOption !== null) return;
    setSelectedOption(opt);
  };

  const handleNext = () => {
    if (selectedOption === null) return;
    const newAnswers = [...answers, selectedOption];
    setAnswers(newAnswers);
    setSelectedOption(null);

    if (currentQ + 1 >= questions.length) {
      evaluateMutation.mutate(newAnswers);
    } else {
      setCurrentQ((q) => q + 1);
    }
  };

  const handleRestart = () => {
    setPhase('pick-language');
    setSelectedLang('');
    setQuestions([]);
    setAnswers([]);
    setSelectedOption(null);
    setResult(null);
    setCurrentQ(0);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Тест на рівень</h1>
          <p className="text-sm text-gray-500">Визначте свій рівень знань мови</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* PHASE: pick language */}
        {phase === 'pick-language' && (
          <motion.div key="pick" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="glass rounded-2xl p-6 border border-white/20">
              <h2 className="font-semibold text-gray-800 mb-4">Оберіть мову для тесту</h2>
              <input
                value={langSearch}
                onChange={(e) => setLangSearch(e.target.value)}
                placeholder="Пошук мови…"
                className="w-full border border-gray-200 dark:border-white/10 rounded-xl p-3 text-gray-800 dark:text-white mb-2 focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white dark:bg-white/[0.04]"
              />
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="w-full border border-gray-200 dark:border-white/10 rounded-xl p-3 text-gray-800 dark:text-white mb-6 focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white dark:bg-white/[0.04]"
                size={langSearch ? Math.min(8, (languages?.filter(l => l.name.toLowerCase().includes(langSearch.toLowerCase()) || l.code.toLowerCase().includes(langSearch.toLowerCase()))?.length ?? 0) + 1) : undefined}
              >
                <option value="">— оберіть мову —</option>
                {languages?.filter(l =>
                  !langSearch ||
                  l.name.toLowerCase().includes(langSearch.toLowerCase()) ||
                  l.code.toLowerCase().includes(langSearch.toLowerCase())
                ).map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag_emoji} {l.name}
                  </option>
                ))}
              </select>
              <button
                disabled={!selectedLang || generateMutation.isPending}
                onClick={() => generateMutation.mutate(selectedLang)}
                className="w-full gradient-bg text-white rounded-xl py-3 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {generateMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Генеруємо тест…</>
                ) : (
                  <>Почати тест <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* PHASE: testing */}
        {phase === 'testing' && questions.length > 0 && (
          <motion.div key="testing" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="glass rounded-2xl p-6 border border-white/20">
              {/* Progress bar */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Питання {currentQ + 1} з {questions.length}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${LEVEL_COLORS[questions[currentQ].level] ?? ''}`}>
                  {questions[currentQ].level}
                </span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-white/8 rounded-full mb-6 overflow-hidden">
                <div
                  className="h-full gradient-bg rounded-full transition-all duration-500"
                  style={{ width: `${((currentQ) / questions.length) * 100}%` }}
                />
              </div>

              <p className="text-gray-900 font-semibold text-lg mb-6 leading-snug">
                {questions[currentQ].question}
              </p>

              <div className="space-y-3 mb-6">
                {questions[currentQ].options.map((opt) => {
                  let cls = 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-gray-800 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/10';
                  if (selectedOption !== null) {
                    if (opt === questions[currentQ].correct_answer) {
                      cls = 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300';
                    } else if (opt === selectedOption && opt !== questions[currentQ].correct_answer) {
                      cls = 'border-red-400 bg-red-50 dark:bg-red-500/15 text-red-800 dark:text-red-300';
                    } else {
                      cls = 'border-gray-100 dark:border-white/6 bg-gray-50 dark:bg-white/[0.02] text-gray-400';
                    }
                  } else if (opt === selectedOption) {
                    cls = 'border-primary-400 bg-primary-50 dark:bg-primary-500/15 text-primary-800 dark:text-primary-300';
                  }
                  return (
                    <button
                      key={opt}
                      onClick={() => handleSelectOption(opt)}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${cls}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {selectedOption !== null && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
                  <div className={`rounded-xl p-3 text-sm ${selectedOption === questions[currentQ].correct_answer ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {selectedOption === questions[currentQ].correct_answer
                      ? <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Правильно!</span>
                      : <span className="flex items-center gap-1"><XCircle className="w-4 h-4" /> Неправильно.</span>
                    }
                    <p className="mt-1 opacity-80">{questions[currentQ].explanation}</p>
                  </div>
                </motion.div>
              )}

              <button
                disabled={selectedOption === null || evaluateMutation.isPending}
                onClick={handleNext}
                className="w-full gradient-bg text-white rounded-xl py-3 font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {evaluateMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Оцінюємо…</>
                ) : currentQ + 1 >= questions.length ? 'Завершити тест' : 'Наступне питання'}
              </button>
            </div>
          </motion.div>
        )}

        {/* PHASE: result */}
        {phase === 'result' && result && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <div className="glass rounded-2xl p-8 border border-white/20 text-center">
              <div className="text-6xl mb-4">🎓</div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Ваш рівень {languageName}</h2>
              <div className={`inline-block text-3xl font-extrabold px-6 py-2 rounded-2xl border-2 mb-4 ${LEVEL_COLORS[result.level] ?? 'bg-gray-100 text-gray-700'}`}>
                {result.level}
              </div>
              <p className="text-gray-600 mb-6">{result.feedback}</p>

              <div className="grid grid-cols-5 gap-2 mb-8">
                {['A1', 'A2', 'B1', 'B2', 'C1'].map((lv) => {
                  const correct = result.correct_per_level[lv] ?? 0;
                  const questionsForLevel = questions.filter((q) => q.level === lv).length || 5;
                  const passed = correct > questionsForLevel / 2;
                  return (
                    <div key={lv} className="flex flex-col items-center gap-1">
                      <span className="text-xs font-bold text-gray-500">{lv}</span>
                      {passed
                        ? <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        : <XCircle className="w-6 h-6 text-red-400" />
                      }
                      <span className="text-xs text-gray-400">{correct}/{questionsForLevel}</span>
                    </div>
                  );
                })}
              </div>

              <p className="text-gray-500 mb-6 text-sm">
                Правильних відповідей: <strong>{result.score} / {result.total}</strong>
              </p>

              <button
                onClick={handleRestart}
                className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                <RefreshCw className="w-4 h-4" /> Пройти знову
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

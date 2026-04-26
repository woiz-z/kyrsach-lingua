import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookMarked,
  Trash2,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Clock,
  Loader2,
  Plus,
  Languages,
  Volume2,
  AlertCircle,
} from 'lucide-react';
import api from '../services/api';
import type { VocabularyItem } from '../types';
import { toast } from '../components/ui/Toast';
import { useTTS } from '../hooks/useTTS';

const QUALITY_LABELS = [
  { q: 5, label: 'Легко', color: 'bg-emerald-500 hover:bg-emerald-600' },
  { q: 4, label: 'Добре', color: 'bg-blue-500 hover:bg-blue-600' },
  { q: 3, label: 'Пригадав', color: 'bg-amber-500 hover:bg-amber-600' },
  { q: 1, label: 'Важко', color: 'bg-orange-500 hover:bg-orange-600' },
  { q: 0, label: 'Не знаю', color: 'bg-red-500 hover:bg-red-600' },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

/** Convert ISO 639-1 language code to flag emoji (e.g. 'en' → '🇬🇧', 'uk' → '🇺🇦') */
function codeToFlag(code: string): string {
  const map: Record<string, string> = {
    en: '🇬🇧', uk: '🇺🇦', fr: '🇫🇷', de: '🇩🇪', es: '🇪🇸', it: '🇮🇹',
    pt: '🇵🇹', pl: '🇵🇱', nl: '🇳🇱', cs: '🇨🇿', sk: '🇸🇰', ru: '🇷🇺',
    ja: '🇯🇵', zh: '🇨🇳', ko: '🇰🇷', ar: '🇸🇦', tr: '🇹🇷', sv: '🇸🇪',
    no: '🇳🇴', da: '🇩🇰', fi: '🇫🇮', hu: '🇭🇺', ro: '🇷🇴', bg: '🇧🇬',
    hr: '🇭🇷', sr: '🇷🇸', he: '🇮🇱', hi: '🇮🇳', vi: '🇻🇳', th: '🇹🇭',
    id: '🇮🇩', ms: '🇲🇾', el: '🇬🇷', lt: '🇱🇹', lv: '🇱🇻', et: '🇪🇪',
  };
  return map[code?.toLowerCase()] ?? code?.toUpperCase() ?? '?';
}

export default function VocabularyPage() {
  const qc = useQueryClient();
  const { speak, isSupported: ttsSupported } = useTTS();
  const [tab, setTab] = useState<'all' | 'review'>('all');
  const [reviewIdx, setReviewIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ word: '', translation: '', language_code: 'en', context: '' });

  const { data: allItems, isLoading } = useQuery<VocabularyItem[]>({
    queryKey: ['vocabulary'],
    queryFn: () => api.get('/vocabulary/').then((r) => r.data),
  });

  const { data: dueItems, isLoading: dueLoading, isError: dueError, refetch: refetchDue } = useQuery<VocabularyItem[]>({
    queryKey: ['vocabulary-due'],
    queryFn: () => api.get('/vocabulary/due').then((r) => r.data),
    enabled: tab === 'review',
    staleTime: 5 * 60 * 1000, // 5 min — prevents mid-session refetch on network reconnect
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/vocabulary/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vocabulary'] });
      toast('success', 'Слово видалено');
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, quality }: { id: number; quality: number }) =>
      api.post(`/vocabulary/${id}/review`, { quality }),
    onSuccess: () => {
      // Do NOT invalidate vocabulary-due mid-session — that refetches the list
      // and shrinks it while reviewIdx has already advanced, causing items to be skipped.
      // Only refresh the all-words list so review_count updates there.
      qc.invalidateQueries({ queryKey: ['vocabulary'] });
    },
  });

  const addMutation = useMutation({
    mutationFn: () => api.post('/vocabulary/', addForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vocabulary'] });
      setAddForm({ word: '', translation: '', language_code: 'en', context: '' });
      setAddOpen(false);
      toast('success', 'Слово додано!');
    },
    onError: () => toast('error', 'Не вдалося додати слово'),
  });

  const handleQuality = (quality: number) => {
    const items = dueItems ?? [];
    if (!items[reviewIdx]) return;
    reviewMutation.mutate({ id: items[reviewIdx].id, quality });
    setShowAnswer(false);
    if (reviewIdx < items.length - 1) {
      setReviewIdx((i) => i + 1);
    } else {
      setReviewDone(true);
    }
  };

  const formatNextReview = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Сьогодні';
    if (diffDays === 1) return 'Завтра';
    return `Через ${diffDays} дн.`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-primary-500/20">
              <BookMarked className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Словник</h1>
              <p className="text-sm text-gray-500">
                {allItems?.length ?? 0} слів • {dueItems?.length ?? '…'} до повторення
              </p>
            </div>
          </div>
          <button
            onClick={() => setAddOpen(!addOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold gradient-bg shadow-lg shadow-primary-500/20 hover:shadow-primary-500/35 transition-all"
          >
            <Plus className="w-4 h-4" /> Додати слово
          </button>
        </div>

        {/* Add form */}
        <AnimatePresence>
          {addOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-4"
            >
              <div className="glass rounded-2xl p-5 border border-gray-100 space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    value={addForm.word}
                    onChange={(e) => setAddForm({ ...addForm, word: e.target.value })}
                    placeholder="Слово..."
                    className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white/60 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
                  />
                  <input
                    value={addForm.translation}
                    onChange={(e) => setAddForm({ ...addForm, translation: e.target.value })}
                    placeholder="Переклад..."
                    className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white/60 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    value={addForm.language_code}
                    onChange={(e) => setAddForm({ ...addForm, language_code: e.target.value })}
                    placeholder="Код мови (en, de, fr...)"
                    className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white/60 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
                  />
                  <input
                    value={addForm.context}
                    onChange={(e) => setAddForm({ ...addForm, context: e.target.value })}
                    placeholder="Контекст (необов'язково)..."
                    className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white/60 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => addMutation.mutate()}
                    disabled={!addForm.word.trim() || !addForm.translation.trim() || addMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold gradient-bg disabled:opacity-50 shadow-lg shadow-primary-500/20 transition-all"
                  >
                    {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Зберегти
                  </button>
                  <button
                    onClick={() => setAddOpen(false)}
                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-white/6 transition"
                  >
                    Скасувати
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 glass rounded-2xl border border-gray-100 w-fit">
        {([['all', 'Усі слова'], ['review', 'Повторення']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => { setTab(key); setReviewIdx(0); setShowAnswer(false); setReviewDone(false); }}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === key ? 'gradient-bg text-white shadow-lg shadow-primary-500/20' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {label}
            {key === 'review' && dueItems && dueItems.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full font-bold">
                {dueItems.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* All words tab */}
      {tab === 'all' && (
        <>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-16 skeleton rounded-2xl" />)}
            </div>
          ) : allItems && allItems.length > 0 ? (
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
              {allItems.map((word) => (
                <motion.div
                  key={word.id}
                  variants={item}
                  className="glass rounded-2xl px-5 py-4 border border-gray-100 flex items-center gap-4 hover-lift transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-bold text-gray-900">{word.word}</span>
                      <span className="text-gray-300">—</span>
                      <span className="text-gray-600">{word.translation}</span>
                      {word.language_code && (
                        <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full font-medium">
                          {codeToFlag(word.language_code)}
                        </span>
                      )}
                    </div>
                    {word.context && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{word.context}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {formatNextReview(word.next_review_date)}
                      </div>
                      <div className="text-xs text-gray-300">
                        EF: {word.ease_factor.toFixed(2)} · {word.review_count} повторень
                      </div>
                    </div>
                    {ttsSupported && (
                      <button
                        onClick={() => speak(word.word, word.language_code || 'en')}
                        className="p-2 rounded-xl text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-all"
                        title="Прослухати"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteMutation.mutate(word.id)}
                      disabled={deleteMutation.isPending}
                      className="p-2 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="glass rounded-2xl p-10 text-center border border-gray-100">
              <Languages className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">Словник порожній</p>
              <p className="text-sm text-gray-400">Додайте слова під час вивчення уроків або натисніть «Додати слово»</p>
            </div>
          )}
        </>
      )}

      {/* Review tab */}
      {tab === 'review' && (
        <>
          {dueLoading ? (
            <div className="h-64 skeleton rounded-2xl" />
          ) : dueError ? (
            <div className="glass rounded-2xl p-8 text-center border border-red-100">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <p className="font-semibold text-gray-800 mb-1">Не вдалося завантажити слова</p>
              <p className="text-sm text-gray-500 mb-4">Перевірте з'єднання та спробуйте ще раз.</p>
              <button
                onClick={() => refetchDue()}
                className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl text-white font-semibold gradient-bg shadow-lg shadow-primary-500/20 transition-all"
              >
                <RotateCcw className="w-4 h-4" /> Спробувати знову
              </button>
            </div>
          ) : reviewDone || !dueItems || dueItems.length === 0 || reviewIdx >= dueItems.length ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-strong rounded-2xl p-10 text-center border border-emerald-100 bg-emerald-50/30"
            >
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {dueItems?.length === 0 ? 'Немає слів для повторення' : 'Повторення завершено!'}
              </h2>
              <p className="text-gray-500 mb-6">
                {dueItems?.length === 0
                  ? 'Усі слова вивчено на сьогодні. Повертайтеся завтра!'
                  : `Ви повторили ${dueItems?.length ?? 0} слів`}
              </p>
              <button
                onClick={() => { setReviewIdx(0); setShowAnswer(false); setReviewDone(false); qc.invalidateQueries({ queryKey: ['vocabulary-due'] }); }}
                className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl text-white font-semibold gradient-bg shadow-lg shadow-primary-500/20 transition-all"
              >
                <RotateCcw className="w-4 h-4" /> Оновити список
              </button>
            </motion.div>
          ) : (
            <div>
              {/* Progress indicator */}
              <div className="flex items-center justify-between text-sm mb-4">
                <span className="text-gray-500">{reviewIdx + 1} / {dueItems.length}</span>
                <div className="h-2 flex-1 mx-4 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full gradient-bg rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${((reviewIdx) / dueItems.length) * 100}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <span className="text-primary-600 font-semibold">{Math.round((reviewIdx / dueItems.length) * 100)}%</span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={reviewIdx}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.3 }}
                  className="glass-strong rounded-2xl border border-gray-100 overflow-hidden"
                >
                  {/* Word card */}
                  <div className="p-8 text-center">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                      {dueItems[reviewIdx].language_code ? codeToFlag(dueItems[reviewIdx].language_code!) : 'СЛОВО'}
                    </p>
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <h2 className="text-4xl font-extrabold text-gray-900">
                        {dueItems[reviewIdx].word}
                      </h2>
                      {ttsSupported && (
                        <button
                          onClick={() => speak(dueItems[reviewIdx].word, dueItems[reviewIdx].language_code || 'en')}
                          className="p-2 rounded-xl text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
                          title="Прослухати"
                        >
                          <Volume2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    {dueItems[reviewIdx].context && (
                      <p className="text-sm text-gray-400 italic mb-4">
                        Контекст: {dueItems[reviewIdx].context}
                      </p>
                    )}
                    {!showAnswer ? (
                      <button
                        onClick={() => setShowAnswer(true)}
                        className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl border-2 border-primary-200 text-primary-600 font-semibold hover:bg-primary-50 transition-all"
                      >
                        Показати переклад <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <p className="text-2xl font-bold text-primary-600 mb-6">
                          {dueItems[reviewIdx].translation}
                        </p>
                        <p className="text-sm text-gray-500 mb-4">Наскільки добре ви згадали?</p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {QUALITY_LABELS.map(({ q, label, color }) => (
                            <button
                              key={q}
                              onClick={() => handleQuality(q)}
                              disabled={reviewMutation.isPending}
                              className={`px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all ${color} shadow-md disabled:opacity-50`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Card metadata */}
                  <div className="px-8 py-3 bg-gray-50/60 dark:bg-white/[0.03] border-t border-gray-100 dark:border-white/8 flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" /> {dueItems[reviewIdx].review_count} повторень
                    </span>
                    <span>EF: {dueItems[reviewIdx].ease_factor.toFixed(2)}</span>
                    <span>Інтервал: {dueItems[reviewIdx].interval_days} дн.</span>
                    {dueItems[reviewIdx].review_count === 0 && (
                      <span className="ml-auto px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full font-bold">
                        Нове
                      </span>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Skip button */}
              <button
                onClick={() => {
                  setShowAnswer(false);
                  if (reviewIdx < dueItems.length - 1) setReviewIdx((i) => i + 1);
                  else setReviewDone(true);
                }}
                className="mt-4 flex items-center gap-1.5 mx-auto text-sm text-gray-400 hover:text-gray-600 transition"
              >
                <XCircle className="w-4 h-4" /> Пропустити
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

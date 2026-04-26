import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Gamepad2, CheckCircle2, RefreshCw, Loader2, Home, Shuffle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import type { VocabularyItem } from '../types';
import { Confetti } from '../components/ui/Confetti';

interface Card {
  id: string;
  text: string;
  pairId: number;
  type: 'word' | 'translation';
  matched: boolean;
  selected: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function MiniGamePage() {
  const [gameStarted, setGameStarted] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [moves, setMoves] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [wrongPair, setWrongPair] = useState<string[]>([]);

  const { data: vocabulary, isLoading } = useQuery<VocabularyItem[]>({
    queryKey: ['vocabulary'],
    queryFn: () => api.get('/vocabulary/').then((r) => r.data),
  });

  const PAIR_COUNT = 6;

  function initGame(items: VocabularyItem[]) {
    const pool = shuffle(items).slice(0, PAIR_COUNT);
    const wordCards: Card[] = pool.map((item) => ({
      id: `w-${item.id}`,
      text: item.word,
      pairId: item.id,
      type: 'word',
      matched: false,
      selected: false,
    }));
    const translationCards: Card[] = pool.map((item) => ({
      id: `t-${item.id}`,
      text: item.translation,
      pairId: item.id,
      type: 'translation',
      matched: false,
      selected: false,
    }));
    setCards(shuffle([...wordCards, ...translationCards]));
    setMatchedCount(0);
    setMoves(0);
    setSelectedIds([]);
    setShowConfetti(false);
    setGameStarted(true);
  }

  const handleCardClick = (card: Card) => {
    if (card.matched || card.selected || selectedIds.length >= 2 || wrongPair.length > 0) return;

    const newSelected = [...selectedIds, card.id];
    setSelectedIds(newSelected);
    setCards((prev) => prev.map((c) => c.id === card.id ? { ...c, selected: true } : c));

    if (newSelected.length === 2) {
      setMoves((m) => m + 1);
      const [id1, id2] = newSelected;
      const c1 = cards.find((c) => c.id === id1)!;
      const c2 = cards.find((c) => c.id === id2)!;

      if (c1.pairId === c2.pairId && c1.type !== c2.type) {
        // Match!
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) => newSelected.includes(c.id) ? { ...c, matched: true, selected: false } : c)
          );
          setSelectedIds([]);
          setMatchedCount((m) => {
            const next = m + 1;
            if (next === PAIR_COUNT) {
              setTimeout(() => setShowConfetti(true), 200);
            }
            return next;
          });
        }, 300);
      } else {
        // No match
        setWrongPair(newSelected);
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) => newSelected.includes(c.id) ? { ...c, selected: false } : c)
          );
          setSelectedIds([]);
          setWrongPair([]);
        }, 700);
      }
    }
  };

  const isFinished = matchedCount === PAIR_COUNT && gameStarted;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Confetti active={showConfetti} count={80} />

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg">
          <Gamepad2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Гра «Пари»</h1>
          <p className="text-sm text-gray-500">Знайдіть відповідності між словами та перекладами</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
        </div>
      ) : !vocabulary?.length ? (
        <div className="text-center py-20 glass rounded-2xl border border-white/20">
          <p className="text-gray-500 mb-4">У вашому словнику ще немає слів.</p>
          <Link to="/vocabulary" className="gradient-bg text-white px-6 py-2 rounded-xl font-medium">
            Додати слова
          </Link>
        </div>
      ) : !gameStarted ? (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 border border-white/20 text-center">
          <div className="text-6xl mb-4">🎮</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Готові грати?</h2>
          <p className="text-gray-500 mb-6">
            Буде обрано {Math.min(PAIR_COUNT, vocabulary.length)} пар зі вашого словника.
            Оберіть слово та його переклад.
          </p>
          <button
            onClick={() => initGame(vocabulary)}
            className="gradient-bg text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto"
          >
            <Shuffle className="w-4 h-4" /> Почати гру
          </button>
        </motion.div>
      ) : isFinished ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-2xl p-8 border border-white/20 text-center">
          <div className="text-6xl mb-3">🏆</div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Чудово!</h2>
          <p className="text-gray-500 mb-6">
            Ви знайшли всі {PAIR_COUNT} пар за <strong>{moves}</strong> ходів!
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => initGame(vocabulary)}
              className="gradient-bg text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Ще раз
            </button>
            <Link to="/dashboard"
              className="flex items-center gap-2 border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50">
              <Home className="w-4 h-4" /> Головна
            </Link>
          </div>
        </motion.div>
      ) : (
        <div>
          {/* Stats bar */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm text-gray-500">
              Знайдено: <strong>{matchedCount} / {PAIR_COUNT}</strong>
            </span>
            <span className="text-sm text-gray-500">Ходів: <strong>{moves}</strong></span>
            <button onClick={() => initGame(vocabulary)}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600">
              <RefreshCw className="w-3 h-3" /> Нова гра
            </button>
          </div>

          {/* Progress */}
          <div className="h-2 bg-gray-100 rounded-full mb-6 overflow-hidden">
            <motion.div
              className="h-full gradient-bg rounded-full"
              animate={{ width: `${(matchedCount / PAIR_COUNT) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {cards.map((card) => {
              const isWrong = wrongPair.includes(card.id);
              return (
                <motion.button
                  key={card.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleCardClick(card)}
                  disabled={card.matched}
                  className={`min-h-[72px] rounded-xl p-3 text-sm font-medium border-2 transition-all text-center
                    ${card.matched
                      ? 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 cursor-default'
                      : card.selected && !isWrong
                        ? 'border-primary-400 bg-primary-50 dark:bg-primary-500/15 text-primary-800 dark:text-primary-300 shadow-md'
                        : isWrong
                          ? 'border-red-400 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'
                          : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-gray-800 hover:border-primary-300 dark:hover:border-primary-500/40 hover:bg-primary-50 dark:hover:bg-primary-500/8 cursor-pointer'
                    }`}
                >
                  {card.matched && <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto mb-1" />}
                  {card.text}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

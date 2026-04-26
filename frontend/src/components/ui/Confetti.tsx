import { useEffect, useState, memo } from 'react';

const COLORS = [
  '#6366f1', '#a855f7', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#f43f5e', '#84cc16',
];

interface Piece {
  id: number;
  color: string;
  left: number;
  delay: number;
  duration: number;
  size: number;
  rotation: number;
}

interface ConfettiProps {
  active: boolean;
  count?: number;
}

export const Confetti = memo(function Confetti({ active, count = 90 }: ConfettiProps) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (!active) {
      const t = setTimeout(() => setPieces([]), 4500);
      return () => clearTimeout(t);
    }
    setPieces(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        color: COLORS[i % COLORS.length],
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        duration: 2.8 + Math.random() * 1.8,
        size: 6 + Math.random() * 8,
        rotation: Math.random() * 360,
      })),
    );
  }, [active, count]);

  if (pieces.length === 0) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 9999 }}
      aria-hidden="true"
    >
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            left: `${p.left}%`,
            top: '-20px',
            transform: `rotate(${p.rotation}deg)`,
            animationName: 'confetti-fall',
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            animationFillMode: 'forwards',
            animationTimingFunction: 'ease-in',
          }}
        />
      ))}
    </div>
  );
});

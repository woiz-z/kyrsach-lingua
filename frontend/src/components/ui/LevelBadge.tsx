interface LevelInfo {
  level: number;
  name: string;
  progress: number; // 0-100
  xpForNext: number;
  xpCurrent: number;
}

export function getLevel(xp: number): LevelInfo {
  // threshold(n) = n*(n+1)*50  → 0,100,300,600,1000,1500,2100,...
  let level = 1;
  while (xp >= level * (level + 1) * 50) level++;
  const prev = (level - 1) * level * 50;
  const next = level * (level + 1) * 50;
  const progress = Math.min(100, Math.max(0, Math.round(((xp - prev) / (next - prev)) * 100)));

  const NAMES: Record<number, string> = {
    1: 'Новачок',
    2: 'Учень',
    3: 'Практикант',
    4: 'Знавець',
    5: 'Майстер',
    6: 'Експерт',
    7: 'Чемпіон',
    8: 'Легенда',
    9: 'Grand Master',
    10: 'Polyglot',
  };

  return {
    level,
    name: NAMES[level] ?? `Рівень ${level}`,
    progress,
    xpForNext: next,
    xpCurrent: xp,
  };
}

interface LevelBadgeProps {
  xp: number;
  showBar?: boolean;
  className?: string;
}

export default function LevelBadge({ xp, showBar = false, className = '' }: LevelBadgeProps) {
  const info = getLevel(xp);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full gradient-bg text-white text-sm font-extrabold shadow">
          {info.level}
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-gray-800">{info.name}</span>
          <span className="text-xs text-gray-400">{info.xpCurrent} / {info.xpForNext} XP</span>
        </div>
      </div>
      {showBar && (
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full gradient-bg transition-all duration-700"
            style={{ width: `${info.progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

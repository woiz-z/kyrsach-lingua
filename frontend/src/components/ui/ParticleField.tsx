const PARTICLES = [
  { x: 12, y: 18, size: 3,   delay: 0,    dur: 4.2, c: 0 },
  { x: 28, y: 72, size: 2,   delay: 0.8,  dur: 3.6, c: 1 },
  { x: 45, y: 35, size: 2.5, delay: 1.6,  dur: 5.1, c: 2 },
  { x: 62, y: 55, size: 2,   delay: 0.4,  dur: 4.7, c: 0 },
  { x: 78, y: 22, size: 3,   delay: 2.1,  dur: 3.8, c: 1 },
  { x: 91, y: 68, size: 2,   delay: 1.2,  dur: 4.4, c: 2 },
  { x: 8,  y: 85, size: 2.5, delay: 0.6,  dur: 5.5, c: 0 },
  { x: 35, y: 12, size: 2,   delay: 1.9,  dur: 3.9, c: 1 },
  { x: 55, y: 88, size: 3,   delay: 0.3,  dur: 4.6, c: 2 },
  { x: 70, y: 42, size: 2,   delay: 2.5,  dur: 5.2, c: 0 },
  { x: 85, y: 8,  size: 2.5, delay: 1.1,  dur: 3.7, c: 1 },
  { x: 20, y: 50, size: 2,   delay: 3.0,  dur: 4.9, c: 2 },
  { x: 50, y: 62, size: 3,   delay: 0.9,  dur: 4.1, c: 0 },
  { x: 75, y: 78, size: 2,   delay: 2.3,  dur: 3.5, c: 1 },
  { x: 38, y: 95, size: 2.5, delay: 1.4,  dur: 5.8, c: 2 },
  { x: 95, y: 45, size: 2,   delay: 0.7,  dur: 4.3, c: 0 },
  { x: 5,  y: 35, size: 3,   delay: 1.8,  dur: 3.3, c: 1 },
  { x: 60, y: 25, size: 2,   delay: 2.7,  dur: 5.0, c: 2 },
];

const BG  = ['rgba(99,102,241,0.65)',  'rgba(168,85,247,0.55)',  'rgba(236,72,153,0.5)'];
const SHD = [
  '0 0 8px rgba(99,102,241,0.6),  0 0 20px rgba(99,102,241,0.2)',
  '0 0 8px rgba(168,85,247,0.55), 0 0 18px rgba(168,85,247,0.18)',
  '0 0 6px rgba(236,72,153,0.5),  0 0 14px rgba(236,72,153,0.15)',
];

export default function ParticleField() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="particle-dot"
          style={{
            left:      `${p.x}%`,
            top:       `${p.y}%`,
            width:     p.size,
            height:    p.size,
            background: BG[p.c],
            boxShadow: SHD[p.c],
            '--dur':   `${p.dur}s`,
            '--delay': `${p.delay}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

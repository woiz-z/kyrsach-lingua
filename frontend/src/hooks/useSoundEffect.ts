import { useCallback, useRef } from 'react';

type SoundType = 'correct' | 'wrong' | 'complete' | 'click' | 'save';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx || ctx.state === 'closed') {
    ctx = new AudioContext();
  }
  return ctx;
}

function playTone(
  frequency: number,
  duration: number,
  gain = 0.25,
  type: OscillatorType = 'sine',
  startAt = 0,
): void {
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gainNode = ac.createGain();
    osc.connect(gainNode);
    gainNode.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ac.currentTime + startAt);
    gainNode.gain.setValueAtTime(gain, ac.currentTime + startAt);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + startAt + duration);
    osc.start(ac.currentTime + startAt);
    osc.stop(ac.currentTime + startAt + duration + 0.01);
  } catch {
    // Silently ignore — audio might be blocked on some browsers
  }
}

export function useSoundEffect(enabled = true) {
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const play = useCallback((type: SoundType) => {
    if (!enabledRef.current) return;
    switch (type) {
      case 'correct':
        playTone(523.25, 0.12, 0.2);       // C5
        playTone(659.25, 0.12, 0.2, 'sine', 0.1); // E5
        playTone(783.99, 0.18, 0.2, 'sine', 0.2); // G5
        break;
      case 'wrong':
        playTone(220, 0.25, 0.2, 'sawtooth');
        playTone(196, 0.25, 0.15, 'sawtooth', 0.15);
        break;
      case 'complete':
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
          playTone(f, 0.22, 0.2, 'sine', i * 0.13);
        });
        break;
      case 'click':
        playTone(800, 0.07, 0.1, 'triangle');
        break;
      case 'save':
        playTone(660, 0.1, 0.15, 'sine');
        playTone(880, 0.14, 0.15, 'sine', 0.1);
        break;
    }
  }, []);

  return play;
}

import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const stored = (localStorage.getItem('theme') as Theme | null) ?? 'light';

function applyTheme(t: Theme) {
  if (t === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem('theme', t);
}

applyTheme(stored);

export const useThemeStore = create<ThemeState>((set) => ({
  theme: stored,
  toggleTheme: () =>
    set((s) => {
      const next: Theme = s.theme === 'light' ? 'dark' : 'light';
      applyTheme(next);
      return { theme: next };
    }),
  setTheme: (t) =>
    set(() => {
      applyTheme(t);
      return { theme: t };
    }),
}));

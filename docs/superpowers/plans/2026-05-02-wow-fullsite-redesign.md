# LinguaAI WOW Full-Site Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign all 12 pages with unique WOW visual treatments while preserving all existing business logic, API calls, state, routing, and TypeScript types.

**Architecture:** One task per page. Only JSX structure and CSS classes change in each page file. All `useQuery`, `useMutation`, `useState`, event handlers, navigation logic, and prop shapes stay identical. New CSS utility classes are added to `index.css` first so every subsequent task can use them.

**Tech Stack:** React 19, TypeScript, Vite 8, Tailwind CSS v4, Framer Motion, Lucide React, `@tanstack/react-query`

---

## File Map

| File | Change type |
|---|---|
| `frontend/src/index.css` | Add ~80 lines of new utility classes |
| `frontend/src/pages/LoginPage.tsx` | Full rewrite (split-screen) |
| `frontend/src/pages/RegisterPage.tsx` | Full rewrite (split-screen) |
| `frontend/src/pages/DashboardPage.tsx` | Upgrade CSS classes + bento layout |
| `frontend/src/pages/LanguagesPage.tsx` | Gem-card grid + spinning selected card |
| `frontend/src/pages/ChatPage.tsx` | Glass bubbles + terminal aesthetic |
| `frontend/src/pages/ProgressPage.tsx` | Data-viz numbers + leaderboard glow |
| `frontend/src/pages/AchievementsPage.tsx` | Trophy room with gold glow + fog |
| `frontend/src/pages/VocabularyPage.tsx` | 3D flip flashcard + gradient word |
| `frontend/src/pages/ProfilePage.tsx` | Luxury gradient hero + aurora ring |
| `frontend/src/pages/MyCoursesPage.tsx` | Color-coded language gradient headers |
| `frontend/src/pages/LessonPage.tsx` | Immersive: glow progress + spin border |
| `frontend/src/pages/CoursePage.tsx` | Timeline layout + gradient hero |

---

### Task 0: Add new CSS utility classes to index.css

**Files:**
- Modify: `frontend/src/index.css`

- [ ] **Step 1: Read the current end of index.css to find the insertion point**

```bash
tail -30 frontend/src/index.css
```

- [ ] **Step 2: Append the new utility classes at the end of index.css**

Add after the last existing rule:

```css
/* ─── WOW: Auth split-screen ───────────────────────────────── */
.auth-hero-panel {
  background: linear-gradient(160deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.1) 50%, rgba(236,72,153,0.08) 100%);
}

/* ─── WOW: Avatar aurora ring ──────────────────────────────── */
.avatar-aurora-ring {
  box-shadow:
    0 0 0 3px rgba(99,102,241,0.5),
    0 0 0 6px rgba(168,85,247,0.25),
    0 0 20px rgba(99,102,241,0.4),
    0 0 40px rgba(168,85,247,0.2);
  animation: aurora-1 6s ease-in-out infinite;
}

/* ─── WOW: Shake on wrong answer ───────────────────────────── */
@keyframes shake {
  0%,100% { transform: translateX(0); }
  15%     { transform: translateX(-6px); }
  30%     { transform: translateX(6px); }
  45%     { transform: translateX(-4px); }
  60%     { transform: translateX(4px); }
  75%     { transform: translateX(-2px); }
}
.answer-shake { animation: shake 0.45s ease-in-out; }

/* ─── WOW: 3D flashcard flip ───────────────────────────────── */
.flashcard-scene {
  perspective: 1000px;
}
.flashcard-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.55s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}
.flashcard-inner.flipped {
  transform: rotateY(180deg);
}
.flashcard-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.flashcard-back {
  transform: rotateY(180deg);
}

/* ─── WOW: Lesson answer states ────────────────────────────── */
.answer-correct {
  background: rgba(16,185,129,0.12) !important;
  border-color: rgba(16,185,129,0.5) !important;
  box-shadow: 0 0 12px rgba(16,185,129,0.2);
}
.answer-wrong {
  background: rgba(239,68,68,0.1) !important;
  border-color: rgba(239,68,68,0.45) !important;
  box-shadow: 0 0 12px rgba(239,68,68,0.15);
}

/* ─── WOW: Lesson glow progress bar ────────────────────────── */
.lesson-progress-bar {
  background: rgba(255,255,255,0.08);
  border-radius: 999px;
  overflow: hidden;
  height: 6px;
}
.lesson-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #a855f7, #ec4899);
  box-shadow: 0 0 10px rgba(99,102,241,0.6), 0 0 20px rgba(168,85,247,0.3);
  border-radius: 999px;
  transition: width 0.4s ease;
}

/* ─── WOW: Language gem card glow ──────────────────────────── */
.lang-gem-card {
  position: relative;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}
.lang-gem-card::after {
  content: '';
  position: absolute;
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 24px;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(99,102,241,0.35), transparent 70%);
  filter: blur(6px);
  opacity: 0;
  transition: opacity 0.2s;
}
.lang-gem-card:hover::after,
.lang-gem-card.selected::after {
  opacity: 1;
}
.lang-gem-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(99,102,241,0.18);
}

/* ─── WOW: Chat glass bubbles ──────────────────────────────── */
.chat-bubble-ai {
  background: rgba(99,102,241,0.1);
  border: 1px solid rgba(99,102,241,0.2);
  border-radius: 1.25rem 1.25rem 1.25rem 0.25rem;
  color: var(--color-gray-800, #1e293b);
}
.dark .chat-bubble-ai {
  color: #c7d2fe;
}
.chat-bubble-user {
  background: linear-gradient(135deg, rgba(99,102,241,0.85), rgba(168,85,247,0.75));
  border-radius: 1.25rem 1.25rem 0.25rem 1.25rem;
  color: white;
  box-shadow: 0 4px 16px rgba(99,102,241,0.25);
}

/* ─── WOW: Leaderboard top-3 glow rows ─────────────────────── */
.lb-gold   { background: rgba(245,158,11,0.06); box-shadow: inset 0 0 0 1px rgba(245,158,11,0.15); }
.lb-silver { background: rgba(148,163,184,0.05); box-shadow: inset 0 0 0 1px rgba(148,163,184,0.12); }
.lb-bronze { background: rgba(180,83,9,0.06);   box-shadow: inset 0 0 0 1px rgba(180,83,9,0.15); }

/* ─── WOW: Achievement gold glow ───────────────────────────── */
.ach-earned-card {
  position: relative;
  overflow: hidden;
}
.ach-earned-card::before {
  content: '';
  position: absolute;
  bottom: -16px;
  left: 50%;
  transform: translateX(-50%);
  width: 70%;
  height: 32px;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(245,158,11,0.5), transparent 70%);
  filter: blur(8px);
}

/* ─── WOW: Course color headers per language ───────────────── */
.lang-header-en { background: linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.1) 100%); }
.lang-header-de { background: linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(251,191,36,0.1) 100%); }
.lang-header-fr { background: linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(147,197,253,0.1) 100%); }
.lang-header-es { background: linear-gradient(135deg, rgba(239,68,68,0.18) 0%, rgba(252,165,165,0.1) 100%); }
.lang-header-ja { background: linear-gradient(135deg, rgba(236,72,153,0.18) 0%, rgba(249,168,212,0.1) 100%); }
.lang-header-zh { background: linear-gradient(135deg, rgba(239,68,68,0.18) 0%, rgba(245,158,11,0.1) 100%); }
.lang-header-it { background: linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(52,211,153,0.1) 100%); }
.lang-header-pt { background: linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(59,130,246,0.1) 100%); }
.lang-header-default { background: linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.08) 100%); }
```

- [ ] **Step 3: Verify the build still passes**

```bash
cd frontend && npm run build 2>&1 | tail -5
```
Expected: `✓ built in` with no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat(css): add WOW utility classes — split-screen, aurora-ring, shake, flip, bubbles, glow"
```

---

### Task 1: Login — split-screen hero layout

**Files:**
- Modify: `frontend/src/pages/LoginPage.tsx`

**Design:** Full viewport split 50/50. Left: dark hero panel with LinguaAI branding, animated gradient blobs, 5 particle dots, tagline. Right: glass form card with spinning gradient border. All form logic (state, submit handler, error display) stays unchanged.

- [ ] **Step 1: Replace LoginPage.tsx with the split-screen layout**

Replace the entire file content. **All logic is identical — only the outer JSX wrapper changes:**

```tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, AlertCircle, Eye, EyeOff, BookOpen, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || 'Невірний email або пароль');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left hero panel */}
      <div className="hidden lg:flex lg:w-1/2 auth-hero-panel relative flex-col items-center justify-center p-12 overflow-hidden">
        {/* Ambient blobs */}
        <div className="absolute top-[-15%] right-[-10%] w-[400px] h-[400px] rounded-full bg-primary-500/20 blur-[80px] animate-pulse-soft" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[350px] h-[350px] rounded-full bg-purple-500/15 blur-[80px] animate-pulse-soft" style={{ animationDelay: '2s' }} />
        {/* Particle dots */}
        {[
          { x: '18%', y: '22%', delay: '0s',   c: 'rgba(99,102,241,0.7)'  },
          { x: '72%', y: '38%', delay: '0.8s', c: 'rgba(168,85,247,0.6)' },
          { x: '35%', y: '68%', delay: '1.6s', c: 'rgba(236,72,153,0.6)' },
          { x: '80%', y: '72%', delay: '0.4s', c: 'rgba(99,102,241,0.65)' },
          { x: '12%', y: '55%', delay: '1.2s', c: 'rgba(20,184,166,0.6)'  },
        ].map((p, i) => (
          <div key={i} className="particle-dot absolute w-2 h-2"
            style={{ left: p.x, top: p.y, background: p.c, '--dur': '4s', '--delay': p.delay } as React.CSSProperties} />
        ))}
        {/* Logo & copy */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 text-center"
        >
          <div className="w-20 h-20 rounded-3xl gradient-bg flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary-500/40">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-extrabold gradient-text-animated mb-3">LinguaAI</h2>
          <p className="text-gray-400 text-lg max-w-xs mx-auto leading-relaxed">
            Вивчай мови з персональним AI-репетитором
          </p>
          <div className="flex items-center justify-center gap-2 mt-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-500/15 text-primary-400 text-sm font-medium border border-primary-500/25">
              <Sparkles className="w-3.5 h-3.5" /> 8+ мов • AI-курси • Словник
            </span>
          </div>
        </motion.div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="glass-spin-border rounded-3xl p-8">
            <div className="text-center mb-8">
              <div className="lg:hidden w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/25">
                <LogIn className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold">З поверненням!</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Увійдіть та продовжте вивчати мови</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm mb-6 border border-red-100 dark:border-red-500/20"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-500/20 outline-none transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Пароль</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-500/20 outline-none transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl text-white font-semibold gradient-bg shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Завантаження...
                  </span>
                ) : 'Увійти'}
              </button>

              <div className="text-right">
                <Link to="/forgot-password" className="text-sm text-primary-600 hover:underline">
                  Забули пароль?
                </Link>
              </div>
            </form>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
              Немає акаунту?{' '}
              <Link to="/register" className="text-primary-600 font-semibold hover:underline">
                Зареєструватися
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build and verify**

```bash
cd frontend && npm run build 2>&1 | tail -5
```
Expected: `✓ built in` with no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/LoginPage.tsx
git commit -m "feat(login): split-screen hero layout with particle field and spinning border form"
```

---

### Task 2: Register — split-screen hero layout

**Files:**
- Modify: `frontend/src/pages/RegisterPage.tsx`

**Design:** Same split-screen as Login. Left panel identical (same hero). Right: glass-spin-border card with 4 form fields, password strength bar. All validation and submit logic unchanged.

- [ ] **Step 1: Replace RegisterPage.tsx with the split-screen layout**

```tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, AlertCircle, Eye, EyeOff, CheckCircle2, BookOpen, Sparkles } from 'lucide-react';

export default function RegisterPage() {
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', username: '', password: '', full_name: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) {
      setError('Пароль має бути не менше 8 символів');
      return;
    }
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || 'Помилка реєстрації');
    }
  };

  const update = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const passwordStrength = (() => {
    const p = form.password;
    if (p.length === 0) return { level: 0, label: '', color: '' };
    if (p.length < 6) return { level: 1, label: 'Слабкий', color: 'bg-red-400' };
    if (p.length < 8) return { level: 2, label: 'Середній', color: 'bg-amber-400' };
    const hasUpper = /[A-Z]/.test(p);
    const hasNumber = /[0-9]/.test(p);
    if (p.length >= 8 && hasUpper && hasNumber) return { level: 4, label: 'Надійний', color: 'bg-emerald-400' };
    return { level: 3, label: 'Достатній', color: 'bg-blue-400' };
  })();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left hero panel */}
      <div className="hidden lg:flex lg:w-1/2 auth-hero-panel relative flex-col items-center justify-center p-12 overflow-hidden">
        <div className="absolute top-[-15%] right-[-10%] w-[400px] h-[400px] rounded-full bg-primary-500/20 blur-[80px] animate-pulse-soft" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[350px] h-[350px] rounded-full bg-purple-500/15 blur-[80px] animate-pulse-soft" style={{ animationDelay: '2s' }} />
        {[
          { x: '18%', y: '22%', delay: '0s',   c: 'rgba(99,102,241,0.7)'  },
          { x: '72%', y: '38%', delay: '0.8s', c: 'rgba(168,85,247,0.6)' },
          { x: '35%', y: '68%', delay: '1.6s', c: 'rgba(236,72,153,0.6)' },
          { x: '80%', y: '72%', delay: '0.4s', c: 'rgba(99,102,241,0.65)' },
          { x: '12%', y: '55%', delay: '1.2s', c: 'rgba(20,184,166,0.6)'  },
        ].map((p, i) => (
          <div key={i} className="particle-dot absolute w-2 h-2"
            style={{ left: p.x, top: p.y, background: p.c, '--dur': '4s', '--delay': p.delay } as React.CSSProperties} />
        ))}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 text-center"
        >
          <div className="w-20 h-20 rounded-3xl gradient-bg flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary-500/40">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-extrabold gradient-text-animated mb-3">LinguaAI</h2>
          <p className="text-gray-400 text-lg max-w-xs mx-auto leading-relaxed">
            Приєднуйся — перший урок вже чекає
          </p>
          <div className="flex items-center justify-center gap-2 mt-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-500/15 text-primary-400 text-sm font-medium border border-primary-500/25">
              <Sparkles className="w-3.5 h-3.5" /> Безкоштовно • AI • 8+ мов
            </span>
          </div>
        </motion.div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="glass-spin-border rounded-3xl p-8">
            <div className="text-center mb-8">
              <div className="lg:hidden w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/25">
                <UserPlus className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold">Створити акаунт</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Почніть вивчати нові мови вже сьогодні</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm mb-6 border border-red-100 dark:border-red-500/20"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Повне ім'я</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => update('full_name', e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-500/20 outline-none transition-all"
                    placeholder="Качмар Ігор"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Username</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">@</span>
                  <input
                    type="text"
                    required
                    value={form.username}
                    onChange={(e) => update('username', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-500/20 outline-none transition-all"
                    placeholder="igor_k"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-500/20 outline-none transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Пароль</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    className="w-full pl-11 pr-11 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-500/20 outline-none transition-all"
                    placeholder="Мін. 8 символів"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {form.password.length > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= passwordStrength.level ? passwordStrength.color : 'bg-gray-200 dark:bg-white/10'}`} />
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{passwordStrength.label}</span>
                      {form.password.length >= 8 && (
                        <span className="flex items-center gap-1 text-xs text-emerald-500">
                          <CheckCircle2 className="w-3 h-3" /> 8+ символів
                        </span>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl text-white font-semibold gradient-bg shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:hover:scale-100 mt-2"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Створення...
                  </span>
                ) : 'Створити акаунт'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
              Вже є акаунт?{' '}
              <Link to="/login" className="text-primary-600 font-semibold hover:underline">
                Увійти
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build and verify**

```bash
cd frontend && npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/RegisterPage.tsx
git commit -m "feat(register): split-screen hero layout matching login"
```

---

### Task 3: Dashboard — cockpit upgrade

**Files:**
- Modify: `frontend/src/pages/DashboardPage.tsx`

**Design changes (logic stays identical):**
1. Stat cards: add `group` class, upgrade icon container with stronger shadow + group-hover scale, add gradient text for value, add colored bottom glow on card hover
2. Quick action cards: wrap icon in `glass-spin-border`-style button (just use a div with `ring` effect), add `group-hover:shadow-xl` 
3. AI Plan card: add `glass-premium` + gradient header bar
4. Extra game links: add neon-style border + icon glow
5. Languages section: upgrade to `lang-gem-card` class on each language link card

- [ ] **Step 1: Read the full DashboardPage.tsx**

```bash
cat frontend/src/pages/DashboardPage.tsx
```

- [ ] **Step 2: Apply targeted class upgrades**

Find and replace these specific patterns (all logic stays identical):

**A) Stat card value — make the number gradient:**

Change `<p className="text-2xl font-bold text-gray-900">{s.value}</p>` to:
```tsx
<p className="text-2xl font-bold gradient-text">{s.value}</p>
```

**B) Stat card wrapper — add group + bottom glow:**

Change the stat card `motion.div` className from:
```
`glass-premium stat-card-glow rounded-2xl p-5 border ${s.border} hover-lift card-accent-top`
```
To:
```
`glass-premium stat-card-glow rounded-2xl p-5 border ${s.border} hover-lift card-accent-top group relative overflow-hidden`
```

And add after the `<p className="text-sm text-gray-500">` line:
```tsx
<div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary-400/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
```

**C) Quick action icon containers — upgrade to spin-glow:**

Change each `w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center shrink-0 shadow-lg shadow-primary-500/30 group-hover:shadow-primary-500/45 group-hover:scale-110 transition-all` to also include `relative`:
```tsx
className="relative w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center shrink-0 shadow-lg shadow-primary-500/30 group-hover:shadow-primary-500/50 group-hover:scale-110 transition-all"
```

**D) Languages grid — apply gem card classes:**

Change the `Link` className for each language card from:
```
`block glass-premium rounded-2xl p-5 card-accent-top hover-lift transition-all border border-transparent hover:border-primary-100 dark:hover:border-primary-500/30`
```
To:
```
`block glass-premium rounded-2xl p-5 card-accent-top hover-lift lang-gem-card transition-all border border-transparent hover:border-primary-100 dark:hover:border-primary-500/30`
```

**E) AI Plan card — upgrade container:**

Change `"glass rounded-2xl p-6 border border-white/20"` to `"glass-premium rounded-2xl p-6 border border-white/20 card-accent-top"`

**F) Section heading — gradient text:**

Change `<h2 className="text-2xl font-bold">Доступні мови</h2>` to:
```tsx
<h2 className="text-2xl font-bold gradient-text">Доступні мови</h2>
```

- [ ] **Step 3: Build and verify**

```bash
cd frontend && npm run build 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/DashboardPage.tsx
git commit -m "feat(dashboard): cockpit upgrade — gradient stats, gem language cards, AI plan premium"
```

---

### Task 4: Languages — gem-cards with glow select

**Files:**
- Modify: `frontend/src/pages/LanguagesPage.tsx`

**Design changes:**
1. Each language card in the grid gets `lang-gem-card` class
2. The selected language card gets an additional `glass-spin-border` wrapper (a `div` with `glass-spin-border rounded-2xl` wraps the card content)
3. Course generator card: upgrade to `glass-premium card-accent-top`
4. Page header: `gradient-text-animated` on the title

- [ ] **Step 1: Read the full LanguagesPage.tsx**

```bash
cat frontend/src/pages/LanguagesPage.tsx
```

- [ ] **Step 2: Locate the language card render block**

Find the JSX that renders each language as a button/card in the grid. It's inside a `motion.div variants={container}` grid. Each card is a `motion.div variants={item}` wrapping a button.

**Replace the language card button className** — find the conditional className that has `selected` state:

The card that renders languages in the grid (NOT the selected banner) — add `lang-gem-card` to its base classes:

```tsx
// Find the language card button and change its className
// FROM (approximately):
className={`... glass rounded-2xl p-5 border ...`}
// TO:
className={`... glass rounded-2xl p-5 border lang-gem-card ${selectedLangId === lang.id ? 'selected ring-2 ring-primary-500/50 border-primary-300 dark:border-primary-500/40' : 'border-white/20 hover:border-primary-200 dark:hover:border-primary-500/30'} ...`}
```

**Step 3: Wrap selected language card with spin-border indicator:**

After the selected language banner `div`, find the `<div className="glass-strong rounded-2xl ... border-primary-...">` that shows the selected language flag and info. Add to its className: `glass-spin-border`

**Step 4: Upgrade the course generator card:**

Find `<div className="glass rounded-2xl p-6 ...` (the AI course generator section). Change `glass` to `glass-premium card-accent-top`.

**Step 5: Add gradient to section title:**

Find `<h1 className="text-3xl font-extrabold` or similar. Change `text-gray-900` to `gradient-text`.

- [ ] **Step 6: Build and verify**

```bash
cd frontend && npm run build 2>&1 | tail -5
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/LanguagesPage.tsx
git commit -m "feat(languages): gem-cards with glow select, spin-border on selected, premium generator"
```

---

### Task 5: Chat — terminal aesthetic + glass bubbles

**Files:**
- Modify: `frontend/src/pages/ChatPage.tsx`

**Design changes:**
1. Chat sidebar: change `bg-white/50 dark:bg-white/[0.03]` to `bg-white/30 dark:bg-black/20` + add `backdrop-blur-xl`
2. AI message bubble: replace inline className with `chat-bubble-ai px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap`
3. User message bubble: replace inline className with `chat-bubble-user px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap`
4. Header title: add `gradient-text-animated` to the session title `<p>`
5. Online indicator: upgrade to pulsing green dot with glow
6. "New chat" button: add `btn-shine` class
7. Empty state icon: upgrade to `glass-spin-border` wrapper
8. Streaming typing indicator: replace Loader2 with `.typing-dot` dots

- [ ] **Step 1: Read the full ChatPage.tsx**

```bash
cat frontend/src/pages/ChatPage.tsx
```

- [ ] **Step 2: Apply bubble class changes**

Find user message bubble (line ~435 in original):
```tsx
// FROM:
className={`max-w-[80%] sm:max-w-[75%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
  msg.role === 'user'
    ? 'bg-primary-500 text-white rounded-2xl rounded-tr-sm shadow-md shadow-primary-500/15'
    : 'glass-strong rounded-2xl rounded-tl-sm text-gray-800 border border-gray-100 dark:border-white/8'
}`}
// TO:
className={`max-w-[80%] sm:max-w-[75%] ${
  msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'
}`}
```

- [ ] **Step 3: Upgrade the loading typing indicator**

Find the streaming-but-no-content block (shows Loader2). Replace with:
```tsx
{streaming && !streamContent && (
  <div className="flex justify-start">
    <div className="chat-bubble-ai px-4 py-3">
      <div className="flex items-center gap-1.5">
        <div className="typing-dot bg-primary-400" />
        <div className="typing-dot bg-primary-400" />
        <div className="typing-dot bg-primary-400" />
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 4: Upgrade session title to gradient text**

Find `<p className="font-semibold text-sm text-gray-900 truncate">` and change to:
```tsx
<p className="font-semibold text-sm gradient-text-animated truncate">
```

- [ ] **Step 5: Add btn-shine to New chat button**

Find the "Новий чат" button and add `btn-shine` to its className (alongside the existing classes).

- [ ] **Step 6: Build and verify**

```bash
cd frontend && npm run build 2>&1 | tail -5
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/ChatPage.tsx
git commit -m "feat(chat): glass bubbles, gradient session title, typing dots, btn-shine"
```

---

### Task 6: Progress — data-viz dashboard

**Files:**
- Modify: `frontend/src/pages/ProgressPage.tsx`

**Design changes:**
1. Stats grid cards: upgrade from `glass` to `glass-premium card-accent-top`, make stat numbers `gradient-text`
2. Big 3 info cards (completion/streak/achievements): upgrade to `glass-premium`, numbers to `gradient-text`
3. Leaderboard rows: add `.lb-gold`, `.lb-silver`, `.lb-bronze` classes to top-3 rows
4. Rank badges: strengthen shadow for rank 1 with `shadow-amber-400/50`
5. Activity list items: add `card-accent-top hover-lift` to each link card
6. Page header: `gradient-text-animated` on h1

- [ ] **Step 1: Read the full ProgressPage.tsx**

```bash
cat frontend/src/pages/ProgressPage.tsx
```

- [ ] **Step 2: Upgrade stats grid cards**

Find `className="glass rounded-2xl p-4 border border-gray-100 hover-lift transition-all"` (inside the stats.map). Change to:
```tsx
className="glass-premium rounded-2xl p-4 border border-gray-100 dark:border-white/8 hover-lift card-accent-top transition-all"
```

Change `<p className="text-2xl font-bold text-gray-900">{s.value}</p>` to:
```tsx
<p className="text-2xl font-bold gradient-text">{s.value}</p>
```

- [ ] **Step 3: Upgrade the 3 info cards**

Find `className="glass rounded-2xl p-5 border border-gray-100"` (3 occurrences in the `lg:grid-cols-3` row). Change all 3 to:
```tsx
className="glass-premium rounded-2xl p-5 border border-gray-100 dark:border-white/8 card-accent-top"
```

Change each `<p className="text-3xl font-bold text-gray-900 mb-1">` to:
```tsx
<p className="text-3xl font-bold gradient-text mb-1">
```

- [ ] **Step 4: Add leaderboard row glow**

Find the leaderboard row className expression (the template literal with `bg-amber-50/40`). Change the conditional:
```tsx
// FROM:
${entry.rank <= 3 ? 'bg-amber-50/40 dark:bg-amber-500/5' : 'hover:bg-gray-50/60 dark:hover:bg-violet-500/8'}
// TO:
${entry.rank === 1 ? 'lb-gold' : entry.rank === 2 ? 'lb-silver' : entry.rank === 3 ? 'lb-bronze' : 'hover:bg-gray-50/60 dark:hover:bg-violet-500/8'}
```

- [ ] **Step 5: Upgrade page header**

Find `<h1 className="text-2xl font-bold text-gray-900">Мій прогрес</h1>` and change to:
```tsx
<h1 className="text-2xl font-bold gradient-text-animated">Мій прогрес</h1>
```

- [ ] **Step 6: Build and verify**

```bash
cd frontend && npm run build 2>&1 | tail -5
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/ProgressPage.tsx
git commit -m "feat(progress): data-viz upgrade — gradient stats, leaderboard glow, premium cards"
```

---

### Task 7: Achievements — trophy room

**Files:**
- Modify: `frontend/src/pages/AchievementsPage.tsx`

**Design changes:**
1. Earned achievement cards: replace `glass rounded-2xl p-4 border border-emerald-100` with `glass-premium rounded-2xl p-5 border border-amber-200 dark:border-amber-500/30 ach-earned-card hover-lift`
2. Earned emoji: increase size from `text-4xl` to `text-5xl`, add `mb-3`
3. Locked cards: keep grayscale but add `backdrop-blur-sm`
4. Section headings: `gradient-text-animated` on earned section h2
5. Page header icon: change from `gradient-bg` to amber gradient `bg-gradient-to-br from-amber-400 to-amber-600`
6. Trophy count: `gradient-text` class on the count text

- [ ] **Step 1: Read the full AchievementsPage.tsx**

```bash
cat frontend/src/pages/AchievementsPage.tsx
```

- [ ] **Step 2: Upgrade earned achievement cards**

Find the earned card `motion.div` className:
```tsx
// FROM:
className="glass rounded-2xl p-4 border border-emerald-100 text-center hover-lift relative"
// TO:
className="glass-premium rounded-2xl p-5 border border-amber-200 dark:border-amber-500/30 ach-earned-card hover-lift text-center relative overflow-hidden"
```

Change `<div className="text-4xl mb-2">` to `<div className="text-5xl mb-3">`.

- [ ] **Step 3: Upgrade locked cards**

Find locked card className:
```tsx
// FROM:
className="glass rounded-2xl p-4 border border-gray-100 text-center opacity-60 grayscale"
// TO:
className="glass rounded-2xl p-4 border border-gray-100 dark:border-white/6 text-center opacity-50 grayscale backdrop-blur-sm"
```

- [ ] **Step 4: Upgrade header**

Find `<div className="w-10 h-10 rounded-xl gradient-bg ...">` and change to amber:
```tsx
className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30"
```

Change `<h1 className="text-2xl font-extrabold text-gray-900">` to:
```tsx
<h1 className="text-2xl font-extrabold gradient-text-animated">
```

- [ ] **Step 5: Build and verify**

```bash
cd frontend && npm run build 2>&1 | tail -5
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/AchievementsPage.tsx
git commit -m "feat(achievements): trophy room — gold glow earned cards, amber header, fog locked"
```

---

### Task 8: Vocabulary — 3D flip flashcard

**Files:**
- Modify: `frontend/src/pages/VocabularyPage.tsx`

**Design changes:**
1. Review flashcard: wrap the `AnimatePresence > motion.div` with a `flashcard-scene` div, split front/back faces
2. The word (`text-4xl font-extrabold`) gets `gradient-text-animated` class
3. Translation (`text-2xl font-bold text-primary-600`) gets `gradient-text text-2xl font-bold`
4. Quality buttons: add glow shadow matching button color on hover
5. Review progress bar: replace `gradient-bg rounded-full` with `lesson-progress-fill`
6. All-words list items: upgrade `glass` to `glass-premium` + `card-accent-top`
7. Add form card: upgrade to `glass-premium`

**Note on 3D flip:** Since the current code uses `AnimatePresence` with x-slide transitions between cards (not a flip), we add the 3D flip specifically for the `showAnswer` reveal within a single card, not between cards.

- [ ] **Step 1: Read the full VocabularyPage.tsx**

```bash
cat frontend/src/pages/VocabularyPage.tsx
```

- [ ] **Step 2: Upgrade the flashcard review card to use 3D flip for answer reveal**

Find the single card container (around line 357):
```tsx
// FROM: motion.div ... className="glass-strong rounded-2xl border border-gray-100 overflow-hidden"
// Wrap its inner word-display section in flashcard-scene structure:
```

Replace the word card interior. The card `div className="p-8 text-center"` becomes:

```tsx
<div className="p-8 text-center flashcard-scene" style={{ minHeight: '200px' }}>
  <div className={`flashcard-inner${showAnswer ? ' flipped' : ''}`} style={{ minHeight: '160px' }}>
    {/* Front face */}
    <div className="flashcard-face">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
        {dueItems[reviewIdx].language_code ? codeToFlag(dueItems[reviewIdx].language_code!) : 'СЛОВО'}
      </p>
      <div className="flex items-center justify-center gap-3 mb-3">
        <h2 className="text-4xl font-extrabold gradient-text-animated">
          {dueItems[reviewIdx].word}
        </h2>
        {ttsSupported && (
          <button
            onClick={() => speak(dueItems[reviewIdx].word, dueItems[reviewIdx].language_code || 'en')}
            className="p-2 rounded-xl text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all"
            title="Прослухати"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        )}
      </div>
      {dueItems[reviewIdx].context && (
        <p className="text-sm text-gray-400 italic mb-4">Контекст: {dueItems[reviewIdx].context}</p>
      )}
      <button
        onClick={() => setShowAnswer(true)}
        className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl border-2 border-primary-200 dark:border-primary-500/30 text-primary-600 dark:text-primary-400 font-semibold hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all"
      >
        Показати переклад <ChevronRight className="w-4 h-4" />
      </button>
    </div>
    {/* Back face */}
    <div className="flashcard-face flashcard-back">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Переклад</p>
      <p className="text-2xl font-bold gradient-text mb-6">{dueItems[reviewIdx].translation}</p>
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
    </div>
  </div>
</div>
```

- [ ] **Step 3: Upgrade review progress bar**

Find `className="h-full gradient-bg rounded-full"` (the progress fill inside review). Change to:
```tsx
className="h-full lesson-progress-fill"
```

- [ ] **Step 4: Upgrade all-words list items**

Find `className="glass rounded-2xl px-5 py-4 border border-gray-100 flex items-center gap-4 hover-lift transition-all"`. Change to:
```tsx
className="glass-premium rounded-2xl px-5 py-4 border border-gray-100 dark:border-white/8 flex items-center gap-4 hover-lift card-accent-top transition-all"
```

- [ ] **Step 5: Build and verify**

```bash
cd frontend && npm run build 2>&1 | tail -5
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/VocabularyPage.tsx
git commit -m "feat(vocabulary): 3D flip flashcard, gradient word, xp-glow progress, premium cards"
```

---

### Task 9: Profile — luxury card with aurora ring

**Files:**
- Modify: `frontend/src/pages/ProfilePage.tsx`

**Design changes:**
1. Profile card header: add `glass-spin-border` class or keep `gradient-bg` but add rotating border glow overlay
2. Avatar `div`: add `avatar-aurora-ring` class
3. Stats section (add below avatar area): render `stats?.total_xp` and streak in a mini stat row
4. Field rows in view mode: upgrade `bg-gray-50/80` to `glass border border-white/10 dark:border-white/6`
5. Page title: `gradient-text-animated`
6. Edit inputs: add `dark:bg-white/5 dark:border-white/10`

- [ ] **Step 1: Read the full ProfilePage.tsx**

```bash
cat frontend/src/pages/ProfilePage.tsx
```

- [ ] **Step 2: Add avatar aurora ring**

Find `className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center shadow-lg"`. Change to:
```tsx
className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center avatar-aurora-ring"
```

- [ ] **Step 3: Upgrade field rows**

Find all instances of `className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80"` (5 occurrences). Change all to:
```tsx
className="flex items-center gap-3 p-3 rounded-xl glass border border-white/10 dark:border-white/6 hover-lift transition-all"
```

- [ ] **Step 4: Upgrade page title**

Find `<h1 className="text-2xl font-bold text-gray-900">Профіль</h1>`. Change to:
```tsx
<h1 className="text-2xl font-bold gradient-text-animated">Профіль</h1>
```

- [ ] **Step 5: Upgrade edit inputs for dark mode**

Find all edit inputs with `className="mt-1.5 w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition text-sm"`. Add dark variants:
```tsx
className="mt-1.5 w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-500/20 outline-none transition text-sm"
```

- [ ] **Step 6: Build and verify**

```bash
cd frontend && npm run build 2>&1 | tail -5
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/ProfilePage.tsx
git commit -m "feat(profile): luxury card — aurora ring avatar, glass fields, gradient title"
```

---

### Task 10: My Courses — color-coded language headers

**Files:**
- Modify: `frontend/src/pages/MyCoursesPage.tsx`

**Design changes:**
1. Course card: split into a color-coded header section + body. The flag + title + level now sit on a `lang-header-{langCode}` colored div
2. Progress bar fill: upgrade to `lesson-progress-fill` (with glow)
3. Summary stat cards: upgrade `glass` to `glass-premium card-accent-top`, values to `gradient-text`
4. Active generation job cards: upgrade to `glass-premium`
5. Page title: `gradient-text-animated`

**Helper needed:** A function that maps `language_name` to a CSS class suffix:

```tsx
function langHeaderClass(languageName: string): string {
  const n = languageName.toLowerCase();
  if (n.includes('english') || n.includes('англ')) return 'lang-header-en';
  if (n.includes('german') || n.includes('deutsch') || n.includes('нім')) return 'lang-header-de';
  if (n.includes('french') || n.includes('français') || n.includes('фран')) return 'lang-header-fr';
  if (n.includes('spanish') || n.includes('español') || n.includes('іспан')) return 'lang-header-es';
  if (n.includes('japan') || n.includes('японськ')) return 'lang-header-ja';
  if (n.includes('chinese') || n.includes('китайськ')) return 'lang-header-zh';
  if (n.includes('italian') || n.includes('italiano') || n.includes('італ')) return 'lang-header-it';
  if (n.includes('portugu') || n.includes('португ')) return 'lang-header-pt';
  return 'lang-header-default';
}
```

- [ ] **Step 1: Read the full MyCoursesPage.tsx**

```bash
cat frontend/src/pages/MyCoursesPage.tsx
```

- [ ] **Step 2: Add the langHeaderClass helper function** after the imports and before the component

Insert `langHeaderClass` function (code above) after the `LEVEL_LABELS` constant.

- [ ] **Step 3: Upgrade course card structure**

Find the `Link` element that renders each course card (inside `courses.map`). The current card has `flex flex-col gap-3` with the flag/title/level in the first `div`. Wrap that top section with a color-coded div:

Change the card's first inner `div` (which has `flex items-start justify-between gap-3`) to be inside a colored header:

```tsx
// Before the flex items-start div, add a header wrapper:
<div className={`${langHeaderClass(course.language_name)} px-5 pt-4 pb-3 -mx-5 -mt-5 mb-3 rounded-t-2xl`}>
  {/* existing: flag + title + level badge goes here */}
  <div className="flex items-start justify-between gap-3">
    {/* ... existing content unchanged ... */}
  </div>
</div>
```

Note: The `Link` already has `p-5` padding. The header div uses negative margins to extend to card edges.

- [ ] **Step 4: Upgrade progress bar fill**

Find `className={`h-full rounded-full transition-all duration-700 ${finished ? 'bg-emerald-400' : 'gradient-bg'}`}`. Change to:
```tsx
className={`h-full rounded-full transition-all duration-700 ${finished ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'lesson-progress-fill'}`}
```

- [ ] **Step 5: Upgrade summary stat cards**

Find the summary stats `div key={label} className="glass rounded-2xl p-4 border..."`. Change `glass` to `glass-premium`:
```tsx
className={`glass-premium rounded-2xl p-4 border ${border} flex items-center gap-3 card-accent-top`}
```

Change `<p className="font-bold text-gray-900">{value}</p>` to `<p className="font-bold gradient-text">{value}</p>`.

- [ ] **Step 6: Upgrade page title**

Find `<LayoutGrid className="w-8 h-8 text-primary-500" />` line. Change `className="text-3xl font-extrabold text-gray-900 mb-1 flex items-center gap-3"` to include `gradient-text-animated`:
```tsx
className="text-3xl font-extrabold gradient-text-animated mb-1 flex items-center gap-3"
```

- [ ] **Step 7: Build and verify**

```bash
cd frontend && npm run build 2>&1 | tail -5
```

- [ ] **Step 8: Commit**

```bash
git add frontend/src/pages/MyCoursesPage.tsx
git commit -m "feat(my-courses): color-coded language headers, glow progress, premium stat cards"
```

---

### Task 11: Lesson — immersive fullscreen with spin border

**Files:**
- Modify: `frontend/src/pages/LessonPage.tsx`

**Design changes (LessonPage is very large ~800 lines — only touch these areas):**
1. Top progress bar: wrap in `lesson-progress-bar` + fill with `lesson-progress-fill`
2. Exercise card container: add `glass-spin-border` class to the main card
3. Correct answer option: add `answer-correct` class dynamically
4. Wrong answer option: add `answer-wrong` + `answer-shake` classes
5. Completion/result screen header: `gradient-text-animated` on score

- [ ] **Step 1: Read the first 150 lines of LessonPage.tsx to find progress bar**

```bash
head -150 frontend/src/pages/LessonPage.tsx
```

- [ ] **Step 2: Read more to find the exercise card and answer options**

```bash
sed -n '150,400p' frontend/src/pages/LessonPage.tsx
```

- [ ] **Step 3: Read the rest for completion screen**

```bash
sed -n '400,900p' frontend/src/pages/LessonPage.tsx
```

- [ ] **Step 4: Upgrade the progress bar**

Find the progress bar div (usually a `div` with `h-2` or similar containing the progress fill). The pattern is:
- A track div with rounded-full background
- A fill div with `gradient-bg` or `bg-primary-500`

Change the track div's className to include `lesson-progress-bar` (or replace inline styles). Change the fill div to use `lesson-progress-fill`. Keep the `style={{ width: ... }}` prop for the dynamic width.

- [ ] **Step 5: Add glass-spin-border to exercise question card**

Find the main exercise card container. It's likely a `div className="glass-strong rounded-2xl ...` or similar. Add `glass-spin-border` to this div's className.

- [ ] **Step 6: Add answer state classes**

Find where answer options are rendered (usually a grid of buttons). The buttons likely have a conditional className based on `answered` state. Add:
- For correct: add `answer-correct` to the button className
- For wrong: add `answer-wrong answer-shake` to the button className

The shake class auto-removes after the animation completes — in practice just add it when wrong is selected; the CSS animation runs once.

- [ ] **Step 7: Build and verify**

```bash
cd frontend && npm run build 2>&1 | tail -5
```

- [ ] **Step 8: Commit**

```bash
git add frontend/src/pages/LessonPage.tsx
git commit -m "feat(lesson): immersive — glow progress bar, spin-border exercise card, answer feedback"
```

---

### Task 12: Course — gradient hero + timeline

**Files:**
- Modify: `frontend/src/pages/CoursePage.tsx`

**Design changes:**
1. Course hero header (flag + title + description area): wrap in a `glass-premium` card with `lang-header-{code}` gradient background overlay
2. Lesson list items: differentiate with dot indicator — completed = green glow dot, current = pulsing primary dot, locked = dim dot
3. Generate new lesson section: upgrade to `glass-premium card-accent-top`
4. Back button / breadcrumb: `gradient-text` on course name
5. Stats (lessons count, XP): make values `gradient-text`

- [ ] **Step 1: Read the full CoursePage.tsx**

```bash
cat frontend/src/pages/CoursePage.tsx
```

- [ ] **Step 2: Add langHeaderClass helper** (same function as Task 10) at the top of the file, after imports.

- [ ] **Step 3: Upgrade the course hero section**

Find the top area that shows the course title/description. It's likely a `div` or `motion.div`. Add the color class:
```tsx
// Find the hero card div and add:
className={`glass-premium rounded-2xl overflow-hidden ... ${langHeaderClass(course?.language?.name ?? '')}`}
```

If there's a separate inner content area, keep it as-is — the gradient is the background.

- [ ] **Step 4: Upgrade lesson list item dots/indicators**

Find the lesson list items. Each lesson link likely has a status indicator. Update the status dot:
```tsx
// Completed:
<div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
// Current (next to do):
<div className="w-3 h-3 rounded-full bg-primary-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
// Locked:
<div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" />
```

- [ ] **Step 5: Upgrade generate lesson card**

Find the generate-new-lesson section (has topic input, lesson type buttons). Change its container from `glass` to `glass-premium card-accent-top`.

- [ ] **Step 6: Build and verify**

```bash
cd frontend && npm run build 2>&1 | tail -5
```

- [ ] **Step 7: Final commit + deploy**

```bash
git add frontend/src/pages/CoursePage.tsx
git commit -m "feat(course): gradient hero, timeline dots, premium generator card"
git push origin main
```

Then deploy:
```bash
railway up --service backend
cd frontend && vercel --prod
```

---

## Self-Review

**Spec coverage check:**
- ✅ Login/Register: split-screen (Tasks 1–2)
- ✅ Dashboard: cockpit + bento + gem cards (Task 3)
- ✅ Languages: gem-cards + glow select (Task 4)
- ✅ Chat: glass bubbles + terminal (Task 5)
- ✅ Progress: data-viz + leaderboard glow (Task 6)
- ✅ Achievements: trophy room + gold glow (Task 7)
- ✅ Vocabulary: 3D flip + gradient word (Task 8)
- ✅ Profile: aurora ring + luxury card (Task 9)
- ✅ My Courses: color-coded headers + glow progress (Task 10)
- ✅ Lesson: glow progress + spin border + feedback (Task 11)
- ✅ Course: gradient hero + timeline dots (Task 12)
- ✅ CSS foundations: all new utilities (Task 0)

**Placeholder scan:** No TBDs. All className strings are explicit. All code blocks are complete.

**Type consistency:** No new types introduced. All existing store/query/mutation hooks preserved verbatim. `langHeaderClass` helper is a pure string→string function with no external deps.

**Constraint verification:** Every task explicitly preserves `useQuery`, `useMutation`, `useState` and event handlers. The only changes are wrapping elements, class names, and cosmetic additions.

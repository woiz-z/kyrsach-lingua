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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Створити акаунт</h1>
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
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Повне ім'я</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="full_name"
                    type="text"
                    value={form.full_name}
                    onChange={(e) => update('full_name', e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 text-gray-900 dark:text-gray-100 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-500/20 outline-none transition-all"
                    placeholder="Качмар Ігор"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Username</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">@</span>
                  <input
                    id="username"
                    type="text"
                    required
                    value={form.username}
                    onChange={(e) => update('username', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 text-gray-900 dark:text-gray-100 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-500/20 outline-none transition-all"
                    placeholder="igor_k"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="reg_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="reg_email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 text-gray-900 dark:text-gray-100 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-500/20 outline-none transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="reg_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Пароль</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="reg_password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    className="w-full pl-11 pr-11 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 text-gray-900 dark:text-gray-100 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-500/20 outline-none transition-all"
                    placeholder="Мін. 8 символів"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Сховати пароль' : 'Показати пароль'}
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

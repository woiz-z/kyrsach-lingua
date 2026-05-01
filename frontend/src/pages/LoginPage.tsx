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

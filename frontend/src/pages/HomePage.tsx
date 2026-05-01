import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';
import {
  BookOpen, Brain, MessageSquare, Trophy, ArrowRight, Sparkles,
  Globe2, Zap, GraduationCap, Users, Flame, BarChart3,
} from 'lucide-react';
import ParticleField from '../components/ui/ParticleField';

const stats = [
  { value: '8+', label: 'Мов',      icon: Globe2 },
  { value: 'AI', label: 'Генерація', icon: Sparkles },
  { value: '∞',  label: 'Уроків',   icon: GraduationCap },
  { value: '24/7', label: 'Доступ', icon: Users },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function HomePage() {
  const { user } = useAuthStore();

  return (
    <div className="overflow-hidden">
      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center">
        {/* Background orbs */}
        <div className="absolute inset-0 gradient-bg opacity-[0.06]" />
        <div className="absolute top-16 right-8 w-[380px] h-[380px] rounded-full bg-primary-400/18 blur-[90px] animate-pulse-soft" />
        <div className="absolute bottom-16 left-8 w-[480px] h-[480px] rounded-full bg-purple-400/15 blur-[100px] animate-pulse-soft" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-pink-300/8 blur-[120px] animate-pulse-soft" style={{ animationDelay: '4s' }} />
        <div className="absolute top-[20%] left-[20%] w-[200px] h-[200px] rounded-full bg-indigo-300/12 blur-[60px] animate-pulse-soft" style={{ animationDelay: '1s' }} />

        {/* Floating glow particles */}
        <ParticleField />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="section-badge mb-6"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Powered by AI — Llama 3.3 70B
              </motion.div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6 text-balance">
                Вивчай мови з{' '}
                <span className="gradient-text-animated">AI‑репетитором</span>
              </h1>

              <p className="text-xl text-gray-500 leading-relaxed mb-10 max-w-lg">
                Інтерактивна платформа з персональним AI-асистентом, структурованими уроками
                та гейміфікацією для ефективного вивчення іноземних мов.
              </p>

              <div className="flex flex-wrap gap-4">
                {user ? (
                  <Link
                    to="/dashboard"
                    className="btn-shine group inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-lg font-semibold text-white gradient-bg shadow-xl shadow-primary-500/30 hover:shadow-primary-500/45 hover:scale-[1.03] transition-all"
                  >
                    Перейти до навчання
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="btn-shine group inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-lg font-semibold text-white gradient-bg shadow-xl shadow-primary-500/30 hover:shadow-primary-500/45 hover:scale-[1.03] transition-all"
                    >
                      Почати безкоштовно
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-lg font-semibold text-gray-700 glass border border-white/60 shadow-sm hover:shadow-lg hover:border-primary-100 hover:scale-[1.01] transition-all"
                    >
                      Увійти
                    </Link>
                  </>
                )}
              </div>

              {/* Stats mini */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-12 grid grid-cols-4 gap-4"
              >
                {stats.map((s) => (
                  <div key={s.label} className="text-center group">
                    <div className="w-10 h-10 rounded-xl glass-premium flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                      <s.icon className="w-5 h-5 text-primary-500" />
                    </div>
                    <p className="text-lg font-bold text-gray-900">{s.value}</p>
                    <p className="text-xs text-gray-400">{s.label}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Hero chat card — spinning gradient border */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="relative">
                <div className="absolute inset-0 gradient-bg rounded-3xl blur-2xl opacity-25 scale-105" />
                <div className="relative glass-spin-border rounded-3xl p-8 space-y-4 shadow-2xl shadow-primary-500/15">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center shadow-lg shadow-primary-500/30">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">AI Репетитор</p>
                      <p className="text-sm text-gray-500">English • Conversation mode</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs text-emerald-500 font-medium">Online</span>
                    </div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-primary-50 dark:bg-primary-500/10 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-700 dark:text-gray-200 max-w-[80%]"
                  >
                    Hello! 👋 I'm your AI language tutor. Let's practice English today. What topic would you like to discuss?
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.2 }}
                    className="bg-primary-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm ml-auto max-w-[80%]"
                  >
                    I'd like to practice talking about travel and vacation plans! ✈️
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.6 }}
                    className="bg-primary-50 dark:bg-primary-500/10 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-700 dark:text-gray-200 max-w-[80%]"
                  >
                    Great choice! 🌍 Let's start: Where did you go on your last vacation? Try to use past tense verbs.
                  </motion.div>

                  {/* Typing indicator */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.0 }}
                    className="flex items-center gap-2"
                  >
                    <div className="w-7 h-7 rounded-full gradient-bg flex items-center justify-center shrink-0">
                      <Brain className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="bg-primary-50 dark:bg-primary-500/10 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5 text-primary-400">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.2 }}
                    className="flex items-center gap-2 pt-2"
                  >
                    <div className="flex-1 h-10 rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 px-4 flex items-center text-sm text-gray-400">
                      Напишіть повідомлення...
                    </div>
                    <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-primary-500/30">
                      <ArrowRight className="w-4 h-4 text-white" />
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Bento Features ──────────────────────────────────── */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="section-badge mb-4">Можливості платформи</div>
            <h2 className="text-4xl font-extrabold mb-4 text-balance">
              Все для <span className="gradient-text-animated">ефективного навчання</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Поєднання AI-технологій, структурованих курсів та гейміфікації
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="bento-grid"
          >
            {/* ── AI Tutor (large) ── */}
            <motion.div variants={item} className="bento-ai bento-card glass-spin-border rounded-3xl p-7 flex flex-col col-span-2">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center mb-5">
                <Brain className="w-6 h-6 text-primary-500" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-gray-900">AI-репетитор</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Персональний асистент на базі Llama 3.3 70B допомагає з граматикою, лексикою та розмовною практикою
              </p>
              {/* Mini chat */}
              <div className="mt-auto space-y-2.5">
                <div className="bg-primary-50 dark:bg-primary-500/10 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 max-w-[85%]">
                  Let's practice present perfect today! 🎯
                </div>
                <div className="bg-primary-500 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm ml-auto max-w-[80%]">
                  I have studied English for 2 years ✅
                </div>
                <div className="flex items-center gap-1.5 text-primary-400">
                  <div className="w-6 h-6 rounded-full gradient-bg flex items-center justify-center">
                    <Brain className="w-3 h-3 text-white" />
                  </div>
                  <div className="bg-primary-50 dark:bg-primary-500/10 rounded-2xl rounded-tl-sm px-3 py-2 flex gap-1 items-center">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── Dialogs ── */}
            <motion.div variants={item} className="bento-dialogs bento-card glass-premium rounded-3xl p-6 flex items-center gap-5 col-span-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                <MessageSquare className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold mb-1 text-gray-900">Інтерактивні діалоги</h3>
                <p className="text-sm text-gray-500">Спілкуйтесь у реальному часі зі стрімінгом</p>
              </div>
              {/* Sound wave animation */}
              <div className="flex items-end gap-[3px] h-10 shrink-0">
                {[14,22,18,28,20,26,16,24].map((h, i) => (
                  <div
                    key={i}
                    className="sound-bar bg-blue-400"
                    style={{ height: h, animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            </motion.div>

            {/* ── Languages ── */}
            <motion.div variants={item} className="bento-langs bento-card glass-premium rounded-3xl p-6 flex flex-col items-center justify-center text-center">
              <Globe2 className="w-8 h-8 text-emerald-500 mb-3" />
              <p className="text-5xl font-black gradient-text leading-none mb-1">8+</p>
              <p className="text-sm font-semibold text-gray-500">Мов</p>
              <div className="flex gap-1.5 mt-3 flex-wrap justify-center">
                {['🇬🇧', '🇩🇪', '🇫🇷', '🇯🇵', '🇪🇸'].map((f) => (
                  <span key={f} className="text-xl animate-float-slow">{f}</span>
                ))}
              </div>
            </motion.div>

            {/* ── Gamification ── */}
            <motion.div variants={item} className="bento-gamify bento-card glass-premium rounded-3xl p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-6 h-6 text-amber-500" />
                <span className="font-bold text-gray-900">Гейміфікація</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-5 h-5 text-orange-500 animate-flame" />
                <span className="text-sm font-bold text-orange-500">7 днів поспіль</span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-amber-600 font-semibold">+125 XP сьогодні</span>
              </div>
              <div className="mt-auto">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Рівень 4</span><span>60%</span>
                </div>
                <div className="h-2.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                  <div className="h-full w-[60%] rounded-full xp-bar-fill" />
                </div>
              </div>
            </motion.div>

            {/* ── Structured lessons ── */}
            <motion.div variants={item} className="bento-lessons bento-card glass-premium rounded-3xl p-6 flex items-center gap-6 col-span-2">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6 text-purple-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1 text-gray-900">Структуровані уроки</h3>
                <p className="text-sm text-gray-500 mb-3">Курси від A1 до B2 з теорією, вправами та граматичними поясненнями</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { l: 'A1', c: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' },
                    { l: 'A2', c: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' },
                    { l: 'B1', c: 'bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20' },
                    { l: 'B2', c: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' },
                  ].map(({ l, c }) => (
                    <span key={l} className={`px-3 py-1 rounded-xl text-sm font-bold border ${c}`}>{l}</span>
                  ))}
                </div>
              </div>
              <Zap className="w-8 h-8 text-purple-200 dark:text-purple-800 shrink-0 hidden sm:block" />
            </motion.div>

            {/* ── Adaptivity ── */}
            <motion.div variants={item} className="bento-adapt bento-card glass-premium rounded-3xl p-6 flex items-center gap-6 col-span-2">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center shrink-0">
                <BarChart3 className="w-6 h-6 text-rose-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1 text-gray-900">Адаптивність</h3>
                <p className="text-sm text-gray-500 mb-3">Система відстежує прогрес і фокусується на слабких місцях</p>
                <div className="flex items-end gap-1.5 h-10">
                  {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm bg-rose-400/60 dark:bg-rose-500/40"
                      style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Divider ─────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4"><div className="divider-gradient" /></div>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-b from-transparent to-primary-50/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-extrabold mb-4">
              Як це <span className="gradient-text-animated">працює</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Три прості кроки до ефективного вивчення мови
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Оберіть мову', desc: 'Виберіть одну з 8+ доступних мов та рівень складності від A1 до B2', icon: Globe2 },
              { step: '02', title: 'Навчайтесь з AI', desc: 'AI згенерує персональний курс з уроками, теорією та інтерактивними вправами', icon: Brain },
              { step: '03', title: 'Відстежуйте прогрес', desc: 'Зарабляйте XP, підтримуйте страйк та отримуйте досягнення за ваші успіхи', icon: Trophy },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative text-center group"
              >
                <div className="relative inline-block mb-6">
                  <div className="w-20 h-20 rounded-2xl glass-premium flex items-center justify-center mx-auto group-hover:scale-105 transition-transform duration-300">
                    <s.icon className="w-9 h-9 text-primary-500" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full gradient-bg text-white text-sm font-bold flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:scale-110 transition-transform">
                    {s.step}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Languages ────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl font-extrabold mb-6">
              Доступні <span className="gradient-text-animated">мови</span>
            </h2>
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {['🇬🇧 English', '🇩🇪 Deutsch', '🇫🇷 Français', '🇪🇸 Español', '🇮🇹 Italiano', '🇯🇵 日本語', '🇨🇳 中文', '🇵🇱 Polski'].map(
                (lang, i) => (
                  <motion.div
                    key={lang}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className="glass-premium px-6 py-3 rounded-2xl text-lg font-medium hover:scale-105 hover:shadow-lg hover:shadow-primary-500/10 transition-all duration-300 cursor-default"
                  >
                    {lang}
                  </motion.div>
                ),
              )}
            </div>
            {!user && (
              <Link
                to="/register"
                className="btn-shine group inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-lg font-semibold text-white gradient-bg shadow-xl shadow-primary-500/30 hover:shadow-primary-500/45 hover:scale-[1.03] transition-all"
              >
                Розпочати навчання <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      {!user && (
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative rounded-3xl overflow-hidden"
            >
              <div className="absolute inset-0 gradient-bg opacity-90" />
              {/* Inner particles */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[10,30,50,70,90].map((x, i) => (
                  <div
                    key={i}
                    className="particle-dot"
                    style={{
                      left: `${x}%`, top: `${20 + i * 12}%`,
                      width: 3, height: 3,
                      background: 'rgba(255,255,255,0.5)',
                      boxShadow: '0 0 6px rgba(255,255,255,0.4)',
                      '--dur': `${3.5 + i * 0.5}s`,
                      '--delay': `${i * 0.4}s`,
                    } as React.CSSProperties}
                  />
                ))}
              </div>
              <div className="relative px-8 py-16 sm:px-16 text-center">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                  Готові почати навчання?
                </h2>
                <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
                  Приєднуйтесь до LinguaAI та почніть вивчати нову мову вже сьогодні
                </p>
                <Link
                  to="/register"
                  className="btn-shine group inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-lg font-semibold text-primary-700 bg-white shadow-xl hover:shadow-2xl hover:scale-[1.03] transition-all"
                >
                  Створити акаунт безкоштовно
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="py-8 border-t border-gray-100 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-bg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold gradient-text-animated">LinguaAI</span>
          </div>
          <p className="text-sm text-gray-400 text-center">
            © 2026 LinguaAI — Курсовий проект. Качмар Ігор, ОІ-33, НУ «Львівська політехніка»
          </p>
        </div>
      </footer>
    </div>
  );
}

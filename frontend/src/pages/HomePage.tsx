import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';
import { BookOpen, Brain, MessageSquare, Trophy, ArrowRight, Sparkles, Globe2, Zap, GraduationCap, Users } from 'lucide-react';

const features = [
  { icon: Brain, title: 'AI-репетитор', desc: 'Персональний асистент на базі штучного інтелекту допоможе з граматикою, лексикою та розмовною практикою', color: 'bg-primary-50 text-primary-500' },
  { icon: MessageSquare, title: 'Інтерактивні діалоги', desc: 'Спілкуйтеся з AI будь-якою мовою у режимі реального часу зі стрімінгом відповідей', color: 'bg-blue-50 text-blue-500' },
  { icon: Globe2, title: '8+ мов', desc: 'Англійська, німецька, французька, іспанська, італійська, японська, китайська, польська та інші', color: 'bg-emerald-50 text-emerald-500' },
  { icon: Trophy, title: 'Гейміфікація', desc: 'Зарабляйте XP, підтримуйте страйк та отримуйте досягнення за свій прогрес', color: 'bg-amber-50 text-amber-500' },
  { icon: BookOpen, title: 'Структуровані уроки', desc: 'Курси від A1 до B2 з теорією, вправами та граматичними поясненнями', color: 'bg-purple-50 text-purple-500' },
  { icon: Zap, title: 'Адаптивність', desc: 'Система відстежує ваш прогрес і допомагає зосередитися на слабких місцях', color: 'bg-rose-50 text-rose-500' },
];

const stats = [
  { value: '8+', label: 'Мов', icon: Globe2 },
  { value: 'AI', label: 'Генерація', icon: Sparkles },
  { value: '∞', label: 'Уроків', icon: GraduationCap },
  { value: '24/7', label: 'Доступ', icon: Users },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function HomePage() {
  const { user } = useAuthStore();

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[92vh] flex items-center">
        <div className="absolute inset-0 gradient-bg opacity-[0.03]" />
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-primary-400/10 blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-20 left-10 w-96 h-96 rounded-full bg-purple-400/10 blur-3xl animate-pulse-soft" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-pink-300/5 blur-[100px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-600 text-sm font-medium mb-6 border border-primary-100"
              >
                <Sparkles className="w-4 h-4" />
                Powered by AI — Llama 3.3 70B
              </motion.div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6 text-balance">
                Вивчай мови з{' '}
                <span className="gradient-text">AI‑репетитором</span>
              </h1>
              <p className="text-xl text-gray-500 leading-relaxed mb-10 max-w-lg">
                Інтерактивна платформа з персональним AI-асистентом, структурованими уроками
                та гейміфікацією для ефективного вивчення іноземних мов.
              </p>
              <div className="flex flex-wrap gap-4">
                {user ? (
                  <Link
                    to="/dashboard"
                    className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-lg font-semibold text-white gradient-bg shadow-xl shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.02] transition-all"
                  >
                    Перейти до навчання
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-lg font-semibold text-white gradient-bg shadow-xl shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.02] transition-all"
                    >
                      Почати безкоштовно
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-lg font-semibold text-gray-700 bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all"
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
                  <div key={s.label} className="text-center">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center mx-auto mb-2">
                      <s.icon className="w-5 h-5 text-primary-500" />
                    </div>
                    <p className="text-lg font-bold text-gray-900">{s.value}</p>
                    <p className="text-xs text-gray-400">{s.label}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="relative">
                <div className="absolute inset-0 gradient-bg rounded-3xl blur-2xl opacity-20 scale-105" />
                <div className="relative glass-strong rounded-3xl p-8 space-y-4 shadow-2xl shadow-primary-500/10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center shadow-lg shadow-primary-500/25">
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
                    className="bg-primary-50 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-700 max-w-[80%]"
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
                    className="bg-primary-50 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-700 max-w-[80%]"
                  >
                    Great choice! 🌍 Let's start: Where did you go on your last vacation? Try to use past tense verbs.
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2 }}
                    className="flex items-center gap-2 pt-2"
                  >
                    <div className="flex-1 h-10 rounded-xl border border-gray-200 bg-white/50 px-4 flex items-center text-sm text-gray-400">
                      Напишіть повідомлення...
                    </div>
                    <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-white" />
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 text-primary-600 text-sm font-medium mb-4 border border-primary-100">
              Можливості платформи
            </div>
            <h2 className="text-4xl font-extrabold mb-4 text-balance">
              Все для <span className="gradient-text">ефективного навчання</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Поєднання AI-технологій, структурованих курсів та гейміфікації
            </p>
          </motion.div>

          <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <motion.div key={f.title} variants={item} className="group glass rounded-2xl p-6 hover:shadow-xl hover:shadow-primary-500/5 hover-lift transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-gray-900">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-gradient-to-b from-transparent to-primary-50/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-extrabold mb-4">
              Як це <span className="gradient-text">працює</span>
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
                className="relative text-center"
              >
                <div className="relative inline-block mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto border border-primary-100">
                    <s.icon className="w-9 h-9 text-primary-500" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full gradient-bg text-white text-sm font-bold flex items-center justify-center shadow-lg shadow-primary-500/25">
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

      {/* Languages */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl font-extrabold mb-6">
              Доступні <span className="gradient-text">мови</span>
            </h2>
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {['🇬🇧 English', '🇩🇪 Deutsch', '🇫🇷 Français', '🇪🇸 Español', '🇮🇹 Italiano', '🇯🇵 日本語', '🇨🇳 中文', '🇵🇱 Polski'].map(
                (lang, i) => (
                  <motion.div
                    key={lang}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="glass px-6 py-3 rounded-2xl text-lg font-medium hover:scale-105 hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-300 cursor-default"
                  >
                    {lang}
                  </motion.div>
                ),
              )}
            </div>
            {!user && (
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-lg font-semibold text-white gradient-bg shadow-xl shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.02] transition-all"
              >
                Розпочати навчання <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
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
              <div className="relative px-8 py-16 sm:px-16 text-center">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                  Готові почати навчання?
                </h2>
                <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
                  Приєднуйтесь до LinguaAI та почніть вивчати нову мову вже сьогодні з персональним AI-репетитором
                </p>
                <Link
                  to="/register"
                  className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-lg font-semibold text-primary-600 bg-white shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all"
                >
                  Створити акаунт безкоштовно
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-bg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold gradient-text">LinguaAI</span>
          </div>
          <p className="text-sm text-gray-400 text-center">
            © 2026 LinguaAI — Курсовий проект. Качмар Ігор, ОІ-33, НУ «Львівська політехніка»
          </p>
        </div>
      </footer>
    </div>
  );
}

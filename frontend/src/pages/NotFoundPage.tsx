import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-lg"
      >
        <div className="relative mb-8">
          <div className="text-[10rem] font-black leading-none gradient-text select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-32 h-32 rounded-full bg-primary-400/10 blur-3xl animate-pulse-soft" />
          </div>
        </div>

        <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary-500/25">
          <Search className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">Сторінку не знайдено</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          На жаль, сторінка, яку ви шукаєте, не існує або була переміщена.
          Поверніться на головну та продовжте навчання!
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold gradient-bg shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all"
          >
            <Home className="w-5 h-5" />
            На головну
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-gray-700 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Повернутися назад
          </button>
        </div>
      </motion.div>
    </div>
  );
}

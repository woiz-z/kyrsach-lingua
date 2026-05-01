import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { ToastContainer } from '../ui/Toast';
import { useThemeStore } from '../../store/themeStore';

export default function Layout() {
  const location = useLocation();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen relative${isDark ? ' dark' : ''}`}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-[#07091a] dark:via-[#0b0e24] dark:to-[#090b1e] relative transition-colors duration-300">
        {/* Ambient background decorations */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          {/* Light mode blobs */}
          <div className="dark:hidden absolute top-[-12%] right-[-6%] w-[650px] h-[650px] rounded-full bg-primary-300/25 blur-[110px] animate-pulse-soft" />
          <div className="dark:hidden absolute bottom-[-12%] left-[-6%] w-[550px] h-[550px] rounded-full bg-purple-300/20 blur-[110px] animate-pulse-soft" style={{ animationDelay: '2s' }} />
          <div className="dark:hidden absolute top-[38%] left-[28%] w-[380px] h-[380px] rounded-full bg-pink-200/18 blur-[90px] animate-pulse-soft" style={{ animationDelay: '4s' }} />
          <div className="dark:hidden absolute top-[15%] left-[5%] w-[280px] h-[280px] rounded-full bg-indigo-200/20 blur-[80px] animate-pulse-soft" style={{ animationDelay: '1s' }} />
          <div className="dark:hidden absolute bottom-[20%] right-[8%] w-[320px] h-[320px] rounded-full bg-violet-200/18 blur-[90px] animate-pulse-soft" style={{ animationDelay: '3.5s' }} />
        </div>

        {/* Aurora layer — dark mode only, mix-blend-mode: screen creates additive light */}
        {isDark && (
          <div
            className="fixed inset-0 pointer-events-none overflow-hidden -z-10"
            style={{ mixBlendMode: 'screen' }}
          >
            <div style={{
              position: 'absolute', borderRadius: '50%', filter: 'blur(100px)',
              width: '65%', height: '65%', top: '-10%', right: '-8%',
              background: 'radial-gradient(ellipse, rgba(99,102,241,0.28) 0%, transparent 70%)',
              animation: 'aurora-1 14s ease-in-out infinite',
            }} />
            <div style={{
              position: 'absolute', borderRadius: '50%', filter: 'blur(120px)',
              width: '60%', height: '60%', bottom: '-8%', left: '-6%',
              background: 'radial-gradient(ellipse, rgba(139,92,246,0.22) 0%, transparent 70%)',
              animation: 'aurora-2 18s ease-in-out infinite',
            }} />
            <div style={{
              position: 'absolute', borderRadius: '50%', filter: 'blur(110px)',
              width: '50%', height: '55%', top: '30%', left: '22%',
              background: 'radial-gradient(ellipse, rgba(20,184,166,0.14) 0%, transparent 70%)',
              animation: 'aurora-3 16s ease-in-out infinite',
            }} />
            <div style={{
              position: 'absolute', borderRadius: '50%', filter: 'blur(90px)',
              width: '40%', height: '45%', top: '55%', right: '8%',
              background: 'radial-gradient(ellipse, rgba(236,72,153,0.12) 0%, transparent 70%)',
              animation: 'aurora-4 20s ease-in-out infinite',
            }} />
            <div style={{
              position: 'absolute', borderRadius: '50%', filter: 'blur(80px)',
              width: '30%', height: '35%', top: '5%', left: '10%',
              background: 'radial-gradient(ellipse, rgba(6,182,212,0.12) 0%, transparent 70%)',
              animation: 'aurora-1 22s ease-in-out 3s infinite',
            }} />
          </div>
        )}

        <Navbar />
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
        <ToastContainer />
      </div>
    </div>
  );
}

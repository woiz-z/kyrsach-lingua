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
          {/* Light mode blobs — more visible */}
          <div className="dark:hidden absolute top-[-12%] right-[-6%] w-[650px] h-[650px] rounded-full bg-primary-300/25 blur-[110px] animate-pulse-soft" />
          <div className="dark:hidden absolute bottom-[-12%] left-[-6%] w-[550px] h-[550px] rounded-full bg-purple-300/20 blur-[110px] animate-pulse-soft" style={{ animationDelay: '2s' }} />
          <div className="dark:hidden absolute top-[38%] left-[28%] w-[380px] h-[380px] rounded-full bg-pink-200/18 blur-[90px] animate-pulse-soft" style={{ animationDelay: '4s' }} />
          <div className="dark:hidden absolute top-[15%] left-[5%] w-[280px] h-[280px] rounded-full bg-indigo-200/20 blur-[80px] animate-pulse-soft" style={{ animationDelay: '1s' }} />
          <div className="dark:hidden absolute bottom-[20%] right-[8%] w-[320px] h-[320px] rounded-full bg-violet-200/18 blur-[90px] animate-pulse-soft" style={{ animationDelay: '3.5s' }} />
          {/* Dark mode blobs — richer and more vibrant */}
          <div className="hidden dark:block absolute top-[-8%] right-[-3%] w-[700px] h-[700px] rounded-full bg-indigo-600/10 blur-[130px] animate-pulse-soft" />
          <div className="hidden dark:block absolute bottom-[-8%] left-[-3%] w-[600px] h-[600px] rounded-full bg-violet-600/9 blur-[130px] animate-pulse-soft" style={{ animationDelay: '2.5s' }} />
          <div className="hidden dark:block absolute top-[35%] left-[25%] w-[450px] h-[450px] rounded-full bg-purple-600/7 blur-[110px] animate-pulse-soft" style={{ animationDelay: '5s' }} />
          <div className="hidden dark:block absolute top-[60%] right-[10%] w-[300px] h-[300px] rounded-full bg-pink-600/6 blur-[90px] animate-pulse-soft" style={{ animationDelay: '3s' }} />
          <div className="hidden dark:block absolute top-[10%] left-[15%] w-[250px] h-[250px] rounded-full bg-primary-500/6 blur-[80px] animate-pulse-soft" style={{ animationDelay: '1.5s' }} />
        </div>

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

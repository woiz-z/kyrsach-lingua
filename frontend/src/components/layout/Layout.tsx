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
          <div className="dark:hidden absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary-200/20 blur-[100px] animate-pulse-soft" />
          <div className="dark:hidden absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-purple-200/15 blur-[100px] animate-pulse-soft" style={{ animationDelay: '2s' }} />
          <div className="dark:hidden absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-pink-200/10 blur-[100px] animate-pulse-soft" style={{ animationDelay: '4s' }} />
          {/* Dark mode blobs — richer and more vibrant */}
          <div className="hidden dark:block absolute top-[-8%] right-[-3%] w-[600px] h-[600px] rounded-full bg-indigo-600/8 blur-[120px] animate-pulse-soft" />
          <div className="hidden dark:block absolute bottom-[-8%] left-[-3%] w-[500px] h-[500px] rounded-full bg-violet-600/7 blur-[120px] animate-pulse-soft" style={{ animationDelay: '2.5s' }} />
          <div className="hidden dark:block absolute top-[35%] left-[25%] w-[400px] h-[400px] rounded-full bg-purple-600/5 blur-[100px] animate-pulse-soft" style={{ animationDelay: '5s' }} />
          <div className="hidden dark:block absolute top-[60%] right-[10%] w-[280px] h-[280px] rounded-full bg-pink-600/5 blur-[80px] animate-pulse-soft" style={{ animationDelay: '3s' }} />
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

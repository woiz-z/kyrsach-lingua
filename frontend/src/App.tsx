import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import LanguagesPage from './pages/LanguagesPage';
import CoursePage from './pages/CoursePage';
import LessonPage from './pages/LessonPage';
import ChatPage from './pages/ChatPage';
import ProgressPage from './pages/ProgressPage';
import ProfilePage from './pages/ProfilePage';
import VocabularyPage from './pages/VocabularyPage';
import ReviewPage from './pages/ReviewPage';
import AchievementsPage from './pages/AchievementsPage';
import MyCoursesPage from './pages/MyCoursesPage';
import PlacementTestPage from './pages/PlacementTestPage';
import MiniGamePage from './pages/MiniGamePage';
import NotFoundPage from './pages/NotFoundPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  return token ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/languages" element={<PrivateRoute><LanguagesPage /></PrivateRoute>} />
        <Route path="/courses/:courseId" element={<PrivateRoute><CoursePage /></PrivateRoute>} />
        <Route path="/lessons/:lessonId" element={<PrivateRoute><LessonPage /></PrivateRoute>} />
        <Route path="/chat" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
        <Route path="/chat/:sessionId" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
        <Route path="/progress" element={<PrivateRoute><ProgressPage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/vocabulary" element={<PrivateRoute><VocabularyPage /></PrivateRoute>} />
        <Route path="/review" element={<PrivateRoute><ReviewPage /></PrivateRoute>} />
        <Route path="/achievements" element={<PrivateRoute><AchievementsPage /></PrivateRoute>} />
        <Route path="/my-courses" element={<PrivateRoute><MyCoursesPage /></PrivateRoute>} />
        <Route path="/placement-test" element={<PrivateRoute><PlacementTestPage /></PrivateRoute>} />
        <Route path="/mini-game" element={<PrivateRoute><MiniGamePage /></PrivateRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

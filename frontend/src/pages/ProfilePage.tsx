import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Save,
  Loader2,
  Mail,
  AtSign,
  Calendar,
  Shield,
  Pencil,
  Check,
  X,
  Smile,
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { toast } from '../components/ui/Toast';
import type { UserStats } from '../types';
import LevelBadge from '../components/ui/LevelBadge';

const AVATAR_EMOJIS = [
  '🦊','🐺','🦁','🐯','🐻','🐼','🐨','🐸','🦋','🦄',
  '🐧','🦅','🦉','🐙','🦑','🐬','🦈','🐲','👾','🤖',
  '🧙','🧝','🧛','🦸','🧜','🌟','⚡','🔥','💎','🌈',
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function ProfilePage() {
  const { user, fetchMe } = useAuthStore();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [form, setForm] = useState({
    username: user?.username ?? '',
    email: user?.email ?? '',
    full_name: user?.full_name ?? '',
  });

  const { data: stats } = useQuery<UserStats>({
    queryKey: ['stats'],
    queryFn: () => api.get('/progress/stats').then((r) => r.data),
  });

  const updateProfile = useMutation({
    mutationFn: (data: typeof form) =>
      api.patch('/auth/me', data).then((r) => r.data),
    onSuccess: () => {
      fetchMe();
      qc.invalidateQueries({ queryKey: ['progress-stats'] });
      setEditing(false);
      toast('success', 'Профіль оновлено!');
    },
    onError: () => toast('error', 'Не вдалося оновити профіль'),
  });

  const updateAvatar = useMutation({
    mutationFn: (avatar_url: string) =>
      api.patch('/auth/me', { avatar_url }).then((r) => r.data),
    onSuccess: () => {
      fetchMe();
      setAvatarPickerOpen(false);
      toast('success', 'Аватар змінено!');
    },
    onError: () => toast('error', 'Не вдалося змінити аватар'),
  });

  const handleSave = () => {
    if (!form.username.trim() || !form.email.trim()) {
      toast('error', "Заповніть обов'язкові поля");
      return;
    }
    updateProfile.mutate(form);
  };

  const handleCancel = () => {
    setForm({
      username: user?.username ?? '',
      email: user?.email ?? '',
      full_name: user?.full_name ?? '',
    });
    setEditing(false);
  };

  const initials = (user?.full_name || user?.username || '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('uk-UA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '\u2014';

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6"
    >
      {/* Page Header */}
      <motion.div variants={item} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-primary-500/20">
          <User className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Профіль</h1>
          <p className="text-sm text-gray-500">Ваші налаштування</p>
        </div>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        variants={item}
        className="glass-strong rounded-2xl border border-gray-100 overflow-hidden"
      >
        {/* Avatar & Header */}
        <div className="gradient-bg p-6 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute w-40 h-40 bg-white rounded-full -top-16 -right-8" />
            <div className="absolute w-20 h-20 bg-white rounded-full bottom-0 left-12" />
          </div>
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center shadow-lg">
              {user?.avatar_url ? (
                <span className="text-4xl leading-none">{user.avatar_url}</span>
              ) : (
                <span className="text-white text-2xl font-bold">{initials}</span>
              )}
            </div>
            <button
              onClick={() => setAvatarPickerOpen(!avatarPickerOpen)}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white shadow-lg flex items-center justify-center text-primary-600 hover:scale-110 transition-transform"
              title="Змінити аватар"
            >
              <Smile className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <h2 className="text-xl font-bold text-white">
              {user?.full_name || user?.username}
            </h2>
            <p className="text-white/70 text-sm">@{user?.username}</p>
            {stats && (
              <div className="mt-1">
                <LevelBadge xp={stats.total_xp} className="[&_span]:text-white [&_span]:!text-white/90 [&_p]:!text-white/70" />
              </div>
            )}
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="ml-auto p-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition relative"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Emoji picker */}
        <AnimatePresence>
          {avatarPickerOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-b border-gray-100"
            >
              <div className="p-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Оберіть аватар
                </p>
                <div className="grid grid-cols-10 gap-1.5">
                  {AVATAR_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => updateAvatar.mutate(emoji)}
                      disabled={updateAvatar.isPending}
                      className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center hover:bg-primary-50 hover:scale-110 transition-all ${
                        user?.avatar_url === emoji ? 'bg-primary-100 ring-2 ring-primary-400' : 'bg-gray-50'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => { updateAvatar.mutate(''); }}
                  className="mt-2 text-xs text-gray-400 hover:text-red-500 transition"
                >
                  Скинути до ініціалів
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Info */}
        <div className="p-6 space-y-5">
          {editing ? (
            <>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AtSign className="w-3 h-3" /> {"Ім'я користувача"}
                </label>
                <input
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  className="mt-1.5 w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3 h-3" /> Електронна пошта
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  className="mt-1.5 w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3 h-3" /> {"Повне ім'я"}
                </label>
                <input
                  value={form.full_name}
                  onChange={(e) =>
                    setForm({ ...form, full_name: e.target.value })
                  }
                  className="mt-1.5 w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition text-sm"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={updateProfile.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-semibold gradient-bg shadow-lg shadow-primary-500/25 disabled:opacity-60 transition"
                >
                  {updateProfile.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Зберегти
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition flex items-center gap-2"
                >
                  <X className="w-4 h-4" /> Скасувати
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80">
                <AtSign className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">{"Ім'я користувача"}</p>
                  <p className="text-sm font-medium text-gray-900">
                    @{user?.username}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">Електронна пошта</p>
                  <p className="text-sm font-medium text-gray-900">
                    {user?.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80">
                <User className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">{"Повне ім'я"}</p>
                  <p className="text-sm font-medium text-gray-900">
                    {user?.full_name || '\u2014'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">Дата реєстрації</p>
                  <p className="text-sm font-medium text-gray-900">
                    {joinDate}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80">
                <Shield className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">Статус</p>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />{' '}
                    Верифікований
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

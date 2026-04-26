import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Plus,
  MessageSquare,
  Brain,
  BookText,
  Languages as LangIcon,
  HelpCircle,
  Trash2,
  Loader2,
  Menu,
  X,
} from 'lucide-react';
import api from '../services/api';
import type { ChatSession, ChatMessage, Language } from '../types';

const modes = [
  {
    value: 'free_chat',
    label: 'Вільна бесіда',
    icon: MessageSquare,
    color: 'bg-primary-500',
  },
  {
    value: 'grammar',
    label: 'Граматика',
    icon: BookText,
    color: 'bg-emerald-500',
  },
  {
    value: 'vocabulary',
    label: 'Лексика',
    icon: LangIcon,
    color: 'bg-amber-500',
  },
  {
    value: 'quiz',
    label: 'Вікторина',
    icon: HelpCircle,
    color: 'bg-purple-500',
  },
];

export default function ChatPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lessonTitle = searchParams.get('lesson_title');
  const qc = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [showNew, setShowNew] = useState(() => !!lessonTitle);
  const [newLangId, setNewLangId] = useState<number | null>(null);
  const [newMode, setNewMode] = useState('free_chat');
  const [mobileSidebar, setMobileSidebar] = useState(false);

  const { data: sessions } = useQuery<ChatSession[]>({
    queryKey: ['chatSessions'],
    queryFn: () => api.get('/chat/sessions').then((r) => r.data),
  });

  const { data: languages } = useQuery<Language[]>({
    queryKey: ['languages'],
    queryFn: () => api.get('/languages').then((r) => r.data),
  });

  const { data: messages, refetch: refetchMessages } = useQuery<ChatMessage[]>({
    queryKey: ['chatMessages', sessionId],
    queryFn: () =>
      api.get(`/chat/sessions/${sessionId}/messages`).then((r) => r.data),
    enabled: !!sessionId,
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamContent, scrollToBottom]);

  useEffect(() => {
    setMobileSidebar(false);
  }, [sessionId]);

  const createSession = useMutation({
    mutationFn: (data: { language_id: number; mode: string; title: string }) =>
      api.post('/chat/sessions', data).then((r) => r.data),
    onSuccess: (data: ChatSession) => {
      qc.invalidateQueries({ queryKey: ['chatSessions'] });
      setShowNew(false);
      navigate(`/chat/${data.id}`);
    },
  });

  const deleteSession = useMutation({
    mutationFn: (id: number) => api.delete(`/chat/sessions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chatSessions'] });
      if (sessionId) navigate('/chat');
    },
  });

  const sendMessage = async () => {
    if (!input.trim() || !sessionId || streaming) return;
    const text = input.trim();
    setInput('');
    setStreaming(true);
    setStreamContent('');

    const previousMessages = qc.getQueryData<ChatMessage[]>([
      'chatMessages',
      sessionId,
    ]);

    qc.setQueryData<ChatMessage[]>(['chatMessages', sessionId], (old) => [
      ...(old || []),
      {
        id: Date.now(),
        session_id: Number(sessionId),
        role: 'user',
        content: text,
        created_at: new Date().toISOString(),
      },
    ]);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/chat/sessions/${sessionId}/messages/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: text }),
        }
      );

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }

      if (!response.ok || !response.body) {
        throw new Error(
          `Stream request failed with status ${response.status}`
        );
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let full = '';
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;
              full += data;
              setStreamContent(full);
            }
          }
        }
      }
    } catch {
      qc.setQueryData<ChatMessage[]>(
        ['chatMessages', sessionId],
        previousMessages
      );
      setStreamContent(
        'Вибач, AI тимчасово недоступний. Спробуй ще раз за хвилину.'
      );
    } finally {
      setStreaming(false);
      setStreamContent('');
      refetchMessages();
    }
  };

  const handleCreateSession = () => {
    if (!newLangId) return;
    const lang = languages?.find((l) => l.id === newLangId);
    const mode = modes.find((m) => m.value === newMode);
    const baseTitle = `${lang?.flag_emoji} ${lang?.name} \u2014 ${mode?.label}`;
    createSession.mutate({
      language_id: newLangId,
      mode: newMode,
      title: lessonTitle ? `${baseTitle}: ${lessonTitle}` : baseTitle,
    });
  };

  const currentSession = sessions?.find((s) => s.id === Number(sessionId));

  const sidebar = (
    <>
      <div className="p-4">
        <button
          onClick={() => setShowNew(!showNew)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-semibold gradient-bg shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all"
        >
          <Plus className="w-5 h-5" /> Новий чат
        </button>
      </div>

      <AnimatePresence>
        {showNew && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-4 overflow-hidden min-h-0"
          >
            <div className="glass-strong rounded-xl p-4 space-y-3 border border-gray-100 max-h-[60vh] overflow-y-auto">
              {lessonTitle && (
                <div className="bg-primary-50 border border-primary-100 rounded-lg px-3 py-2 text-xs text-primary-700">
                  <span className="font-bold">Контекст уроку:</span> {lessonTitle}
                </div>
              )}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Мова
                  </label>
                  <span className="text-[10px] font-medium text-gray-300">
                    {languages?.length ?? 0}
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto pr-1">
                  <div className="grid grid-cols-5 gap-1.5">
                    {languages?.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => setNewLangId(l.id)}
                        className={`p-2 rounded-lg text-center text-lg transition ${
                          newLangId === l.id
                            ? 'bg-primary-100 dark:bg-primary-500/15 ring-2 ring-primary-500 shadow-sm'
                            : 'hover:bg-gray-100 dark:hover:bg-white/8'
                        }`}
                        title={l.name}
                      >
                        {l.flag_emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Режим
                </label>
                <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                  {modes.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setNewMode(m.value)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                        newMode === m.value
                          ? 'bg-primary-100 dark:bg-primary-500/15 ring-2 ring-primary-500 text-primary-700 dark:text-primary-300'
                          : 'hover:bg-gray-100 dark:hover:bg-white/8 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <m.icon className="w-3.5 h-3.5" /> {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleCreateSession}
                disabled={!newLangId || createSession.isPending}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white gradient-bg disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {createSession.isPending && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Створити
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {sessions?.map((s) => (
          <div
            key={s.id}
            className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
              s.id === Number(sessionId)
                ? 'bg-primary-500/10 dark:bg-primary-500/15 text-primary-700 dark:text-primary-300 border border-primary-100 dark:border-primary-500/25'
                : 'hover:bg-violet-500/8 dark:hover:bg-violet-500/10 text-gray-700 dark:text-gray-300 border border-transparent'
            }`}
            onClick={() => navigate(`/chat/${s.id}`)}
          >
            <Brain className="w-4 h-4 shrink-0" />
            <span className="text-sm truncate flex-1">{s.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteSession.mutate(s.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 dark:hover:bg-red-500/15 hover:text-red-500 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {(!sessions || sessions.length === 0) && (
          <div className="text-center py-8">
            <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Немає чатів</p>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Desktop Sidebar */}
      <div className="w-80 border-r border-gray-100 dark:border-white/8 flex-col bg-white/50 dark:bg-white/[0.03] shrink-0 hidden md:flex min-h-0">
        {sidebar}
      </div>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {mobileSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileSidebar(false)}
            />
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-16 bottom-0 w-80 bg-[#0b0e24] shadow-2xl z-50 flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/8">
                <span className="font-semibold text-gray-900">Чати</span>
                <button
                  onClick={() => setMobileSidebar(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {sidebar}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {sessionId ? (
          <>
            {/* Header */}
            <div className="px-4 sm:px-6 py-3 border-b border-gray-100 dark:border-white/8 flex items-center gap-3 glass-strong">
              <button
                onClick={() => setMobileSidebar(true)}
                className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8 transition"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">
                  {currentSession?.title || 'AI Чат'}
                </p>
                <p className="text-xs text-gray-400">
                  {'AI-репетитор \u2022 '}
                  {modes.find((m) => m.value === currentSession?.mode)?.label ||
                    currentSession?.mode}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-500 font-medium hidden sm:inline">
                  Online
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
              {messages?.length === 0 && !streaming && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center max-w-sm">
                    <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/25">
                      <MessageSquare className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-gray-500 text-sm">
                      Напишіть повідомлення, щоб почати розмову з AI-репетитором
                    </p>
                  </div>
                </div>
              )}
              {messages?.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] sm:max-w-[75%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-primary-500 text-white rounded-2xl rounded-tr-sm shadow-md shadow-primary-500/15'
                        : 'glass-strong rounded-2xl rounded-tl-sm text-gray-800 border border-gray-100 dark:border-white/8'
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {streaming && streamContent && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[80%] sm:max-w-[75%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap glass-strong rounded-2xl rounded-tl-sm text-gray-800 border border-gray-100 dark:border-white/8">
                    {streamContent}
                    <span className="inline-block w-1.5 h-4 bg-primary-500 ml-1 animate-pulse rounded" />
                  </div>
                </motion.div>
              )}
              {streaming && !streamContent && (
                <div className="flex justify-start">
                  <div className="glass-strong rounded-2xl rounded-tl-sm px-4 py-3 border border-gray-100 dark:border-white/8">
                    <div className="flex items-center gap-1.5">
                      <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
                      <span className="text-xs text-gray-400">
                        {"AI думає..."}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 sm:px-6 py-4 border-t border-gray-100 dark:border-white/8 glass-strong">
              <div className="flex items-end gap-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Напишіть повідомлення..."
                  rows={1}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-500/20 outline-none transition-all resize-none"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || streaming}
                  className="p-3 rounded-xl text-white gradient-bg shadow-lg shadow-primary-500/25 disabled:opacity-50 hover:shadow-primary-500/35 transition-all shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="text-center">
              <button
                onClick={() => setMobileSidebar(true)}
                className="md:hidden mb-4 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                <Menu className="w-4 h-4 inline mr-2" />
                Показати чати
              </button>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <div className="w-20 h-20 rounded-3xl gradient-bg flex items-center justify-center mx-auto mb-5 shadow-xl shadow-primary-500/25">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">AI-репетитор</h2>
                <p className="text-gray-500 mb-6 max-w-sm">
                  Оберіть існуючий чат або створіть новий для практики мови з AI
                </p>
                <button
                  onClick={() => {
                    setShowNew(true);
                    setMobileSidebar(true);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold gradient-bg shadow-lg shadow-primary-500/25 hover:shadow-primary-500/35 transition-all"
                >
                  <Plus className="w-5 h-5" /> Новий чат
                </button>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

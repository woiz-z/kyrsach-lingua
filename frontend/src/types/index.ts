export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  native_language: string;
  created_at: string;
}

export interface Language {
  id: number;
  code: string;
  name: string;
  native_name: string;
  flag_emoji: string;
  description: string;
  courses?: Course[];
}

export interface Course {
  id: number;
  language_id: number;
  title: string;
  description: string;
  level: string;
  order: number;
  image_url: string | null;
  language?: Language;
  lessons_count?: number;
}

export interface Lesson {
  id: number;
  course_id: number;
  title: string;
  description: string;
  content: Record<string, unknown>;
  order: number;
  lesson_type: string;
  xp_reward: number;
  exercises?: Exercise[];
}

export interface Exercise {
  id: number;
  lesson_id: number;
  exercise_type: string;
  question: string;
  options: string[] | { choices?: string[] } | null;
  correct_answer: string;
  explanation: string;
  hint: string;
  difficulty: string;
  points: number;
  order: number;
}

export interface ExerciseResult {
  is_correct: boolean;
  correct_answer: string;
  explanation: string;
  points_earned: number;
}

export interface GeneratedExerciseDraft {
  exercise_type: string;
  question: string;
  options: string[] | null;
  correct_answer: string;
  explanation: string;
  hint?: string;
  difficulty?: string;
  points: number;
}

export interface GeneratedLessonContentSection {
  type: string;
  title: string;
  content: string;
}

export interface GeneratedLessonContent {
  sections?: GeneratedLessonContentSection[];
  theory: string;
  examples: string[];
  vocabulary: Record<string, string>;
}

export interface GeneratedLessonDraft {
  title: string;
  description: string;
  lesson_type: string;
  xp_reward: number;
  content: GeneratedLessonContent;
  exercises: GeneratedExerciseDraft[];
}

export interface GenerationJob {
  id: number;
  user_id: number;
  course_id: number | null;
  approved_lesson_id: number | null;
  job_type: string;
  status: string;
  topic: string;
  requested_level: string;
  lesson_type: string;
  exercises_count: number;
  tokens_estimate: number;
  payload_json: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface GenerationPreview {
  job: GenerationJob;
  draft: GeneratedLessonDraft;
}

export interface GenerationApproveResponse {
  job: GenerationJob;
  lesson: Lesson;
}

export interface GenerateCourseResponse {
  job: GenerationJob;
  course: Course;
}

export interface OnDemandExercisesResponse {
  job: GenerationJob;
  exercises: Exercise[];
}

export interface GenerationJobsListResponse {
  items: GenerationJob[];
  total: number;
}

export interface GenerationUsageStats {
  daily_limit: number;
  used_today: number;
  remaining_today: number;
  total_jobs: number;
  drafts_ready: number;
  approved: number;
  failed: number;
}

export interface UserProgress {
  id: number;
  user_id: number;
  course_id: number | null;
  lesson_id: number;
  completed: boolean;
  score: number;
  xp_earned?: number;
  completed_at: string;
}

export interface VocabularyItem {
  id: number;
  word: string;
  translation: string;
  language_code: string;
  context: string | null;
  ease_factor: number;
  interval_days: number;
  next_review_date: string;
  review_count: number;
  created_at: string;
}

export interface VocabularyItemCreate {
  word: string;
  translation: string;
  language_code: string;
  context?: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  username: string;
  avatar_url: string | null;
  total_xp: number;
  lessons_completed: number;
}

export interface ReviewExercisesResponse {
  exercises: Exercise[];
  total: number;
}

export interface UserStreak {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
}

// ─── Gamification ────────────────────────────────────────────────────────────

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  condition_type: string;
  condition_value: number;
  earned: boolean;
  earned_at: string | null;
}

export interface DailyTask {
  id: number;
  task_type: string;
  title: string;
  description: string;
  icon: string;
  target_count: number;
  xp_reward: number;
  progress: number;
  completed: boolean;
}

// ─── Placement Test ──────────────────────────────────────────────────────────

export interface PlacementQuestion {
  id: number;
  level: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export interface PlacementTestGenerateResponse {
  language_code: string;
  language_name: string;
  questions: PlacementQuestion[];
}

export interface PlacementTestResult {
  level: string;
  score: number;
  total: number;
  feedback: string;
  correct_per_level: Record<string, boolean>;
}

// ─── AI Tools ────────────────────────────────────────────────────────────────

export interface TranslateResponse {
  word: string;
  translation: string;
  source_lang: string;
  target_lang: string;
}

export interface DayTask {
  type: string;
  description: string;
  duration_min: number;
  topic?: string;
  goal?: string;
}

export interface DayPlan {
  day: string;
  focus?: string;
  tasks: DayTask[];
  daily_goal?: string;
}

export interface WeeklyMilestone {
  title: string;
  description: string;
}

export interface LearningResource {
  title: string;
  type: string;
  description: string;
}

export interface LearningPlanResponse {
  language_name: string;
  recommended_level: string;
  weekly_goal_xp: number;
  tips: string[];
  daily_plan: DayPlan[];
  milestones?: WeeklyMilestone[];
  resources?: LearningResource[];
  motivation_quote?: string;
}


export interface UserStats {
  total_xp: number;
  lessons_completed: number;
  exercises_completed: number;
  exercises_correct?: number;
  accuracy: number;
  languages_studying: number;
  current_streak: number;
  longest_streak?: number;
  achievements_count?: number;
}

export interface ChatSession {
  id: number;
  user_id: number;
  language_id: number;
  title: string;
  mode: string;
  created_at: string;
  language?: Language;
}

export interface ChatMessage {
  id: number;
  session_id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

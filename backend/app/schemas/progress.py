from pydantic import BaseModel, Field
import datetime


class ProgressResponse(BaseModel):
    id: int
    user_id: int
    lesson_id: int
    course_id: int | None = None
    completed: bool
    score: int
    xp_earned: int
    completed_at: datetime.datetime | None = None

    class Config:
        from_attributes = True


class CourseProgressSummary(BaseModel):
    course_id: int
    title: str
    description: str
    level: str
    language_id: int
    language_name: str
    language_flag: str
    lessons_total: int
    lessons_completed: int
    xp_earned: int
    last_activity: datetime.datetime | None = None

    class Config:
        from_attributes = True


class MyCoursesPageResponse(BaseModel):
    items: list[CourseProgressSummary]
    total: int
    page: int
    pages: int


class StreakResponse(BaseModel):
    current_streak: int
    longest_streak: int
    last_activity_date: datetime.date | None = None

    class Config:
        from_attributes = True


class StatsResponse(BaseModel):
    total_xp: int
    lessons_completed: int
    exercises_completed: int
    exercises_correct: int
    accuracy: float
    languages_studying: int
    current_streak: int
    longest_streak: int
    achievements_count: int


class AchievementResponse(BaseModel):
    id: int
    name: str
    description: str
    icon: str
    earned_at: datetime.datetime | None = None

    class Config:
        from_attributes = True


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    username: str
    avatar_url: str | None = None
    total_xp: int
    lessons_completed: int
    is_current_user: bool = False


class VocabularyItemCreate(BaseModel):
    word: str = Field(..., min_length=1, max_length=300)
    translation: str = Field(..., min_length=1, max_length=300)
    language_code: str = ""
    lesson_id: int | None = None


class VocabularyItemResponse(BaseModel):
    id: int
    word: str
    translation: str
    language_code: str
    lesson_id: int | None = None
    ease_factor: float
    interval_days: int
    next_review_date: datetime.date
    review_count: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class VocabularyReviewRequest(BaseModel):
    quality: int = Field(..., ge=0, le=5, description="SM-2 quality: 0-2=wrong, 3-5=correct")


class ReviewExercisesResponse(BaseModel):
    exercises: list[dict]
    total: int
    id: int
    user_id: int
    lesson_id: int
    course_id: int | None = None
    completed: bool
    score: int
    xp_earned: int
    completed_at: datetime.datetime | None = None

    class Config:
        from_attributes = True


class StreakResponse(BaseModel):
    current_streak: int
    longest_streak: int
    last_activity_date: datetime.date | None = None

    class Config:
        from_attributes = True


class StatsResponse(BaseModel):
    total_xp: int
    lessons_completed: int
    exercises_completed: int
    exercises_correct: int
    accuracy: float
    languages_studying: int
    current_streak: int
    longest_streak: int
    achievements_count: int


class AchievementResponse(BaseModel):
    id: int
    name: str
    description: str
    icon: str
    earned_at: datetime.datetime | None = None

    class Config:
        from_attributes = True

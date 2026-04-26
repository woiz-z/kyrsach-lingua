import datetime
from pydantic import BaseModel, Field
from app.schemas.lesson import LessonResponse, ExerciseResponse
from app.schemas.lesson import CourseResponse


class GenerateLessonDraftRequest(BaseModel):
    course_id: int
    topic: str = Field(min_length=3, max_length=255)
    lesson_type: str = "grammar"
    exercises_count: int = 5
    target_level: str | None = None


class GenerationJobResponse(BaseModel):
    id: int
    user_id: int
    course_id: int | None = None
    approved_lesson_id: int | None = None
    job_type: str
    status: str
    topic: str
    requested_level: str
    lesson_type: str
    exercises_count: int
    tokens_estimate: int
    payload_json: dict | None = None
    error_message: str | None = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True


class GeneratedLessonContentSection(BaseModel):
    type: str = "theory"
    title: str = ""
    content: str = ""


class GeneratedLessonContent(BaseModel):
    sections: list[GeneratedLessonContentSection] = []
    theory: str = ""
    examples: list[str] = []
    vocabulary: dict[str, str] = {}


class GeneratedExercise(BaseModel):
    exercise_type: str
    question: str
    options: list[str] | None = None
    correct_answer: str
    explanation: str = ""
    hint: str = ""
    difficulty: str = "medium"
    points: int = 10


class GeneratedLessonDraft(BaseModel):
    title: str
    description: str
    lesson_type: str = "grammar"
    xp_reward: int = 10
    content: GeneratedLessonContent
    exercises: list[GeneratedExercise]


class GenerationPreviewResponse(BaseModel):
    job: GenerationJobResponse
    draft: GeneratedLessonDraft


class ApproveGenerationResponse(BaseModel):
    job: GenerationJobResponse
    lesson: LessonResponse


class GenerateOnDemandExercisesRequest(BaseModel):
    exercises_count: int = 3
    topic_hint: str | None = None


class GenerateOnDemandExercisesResponse(BaseModel):
    job: GenerationJobResponse
    exercises: list[ExerciseResponse]


class CoursePlanLessonItem(BaseModel):
    topic: str = Field(min_length=3, max_length=200)
    lesson_type: str = "grammar"


class GenerateCourseRequest(BaseModel):
    level: str = Field(min_length=2, max_length=10)
    title: str = Field(min_length=3, max_length=200)
    focus: str = Field(min_length=3, max_length=500)
    course_language: str | None = Field(default=None, min_length=2, max_length=100)
    lessons_count: int = 5
    exercises_per_lesson: int = 5


class GenerateCourseResponse(BaseModel):
    job: GenerationJobResponse
    course: CourseResponse
    lessons: list[LessonResponse]


class GenerationJobsListResponse(BaseModel):
    items: list[GenerationJobResponse]
    total: int


class GenerationUsageStatsResponse(BaseModel):
    daily_limit: int
    used_today: int
    remaining_today: int
    total_jobs: int
    drafts_ready: int
    approved: int
    failed: int

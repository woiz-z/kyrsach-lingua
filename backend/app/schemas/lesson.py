from pydantic import BaseModel


class LanguageResponse(BaseModel):
    id: int
    code: str
    name: str
    native_name: str
    flag_emoji: str
    description: str

    class Config:
        from_attributes = True


class CourseResponse(BaseModel):
    id: int
    language_id: int
    title: str
    description: str
    level: str
    order: int
    image_url: str | None = None

    class Config:
        from_attributes = True


class LessonResponse(BaseModel):
    id: int
    course_id: int
    title: str
    description: str
    content: dict | None = None
    order: int
    lesson_type: str
    xp_reward: int

    class Config:
        from_attributes = True


class ExerciseResponse(BaseModel):
    id: int
    lesson_id: int
    exercise_type: str
    question: str
    options: list[str] | dict | None = None
    correct_answer: str
    explanation: str
    hint: str = ""
    difficulty: str = "medium"
    points: int
    order: int

    class Config:
        from_attributes = True


class ExerciseSubmit(BaseModel):
    answer: str


class ExerciseResult(BaseModel):
    is_correct: bool
    correct_answer: str
    explanation: str
    points_earned: int

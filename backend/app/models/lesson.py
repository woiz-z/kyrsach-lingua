from sqlalchemy import String, Text, Integer, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"))
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    content: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    order: Mapped[int] = mapped_column(Integer, default=0)
    lesson_type: Mapped[str] = mapped_column(String(50), default="grammar")  # grammar, vocabulary, reading, listening, conversation
    xp_reward: Mapped[int] = mapped_column(Integer, default=10)

    course: Mapped["Course"] = relationship(back_populates="lessons")
    exercises: Mapped[list["Exercise"]] = relationship(back_populates="lesson", cascade="all, delete-orphan")


class Exercise(Base):
    __tablename__ = "exercises"

    id: Mapped[int] = mapped_column(primary_key=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id"))
    exercise_type: Mapped[str] = mapped_column(String(50))  # multiple_choice, fill_blank, translate, match
    question: Mapped[str] = mapped_column(Text)
    options: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    correct_answer: Mapped[str] = mapped_column(Text)
    explanation: Mapped[str] = mapped_column(Text, default="")
    hint: Mapped[str] = mapped_column(Text, default="")
    difficulty: Mapped[str] = mapped_column(String(20), default="medium")  # easy, medium, hard
    points: Mapped[int] = mapped_column(Integer, default=10)
    order: Mapped[int] = mapped_column(Integer, default=0)

    lesson: Mapped["Lesson"] = relationship(back_populates="exercises")


from app.models.language import Course  # noqa: E402, F811

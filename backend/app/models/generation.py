import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class GenerationJob(Base):
    __tablename__ = "generation_jobs"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    course_id: Mapped[int | None] = mapped_column(ForeignKey("courses.id"), nullable=True, index=True)
    approved_lesson_id: Mapped[int | None] = mapped_column(ForeignKey("lessons.id"), nullable=True)

    job_type: Mapped[str] = mapped_column(String(50), default="lesson_draft", index=True)
    status: Mapped[str] = mapped_column(String(50), default="running", index=True)
    topic: Mapped[str] = mapped_column(String(255), default="")
    requested_level: Mapped[str] = mapped_column(String(10), default="")
    lesson_type: Mapped[str] = mapped_column(String(50), default="grammar")
    exercises_count: Mapped[int] = mapped_column(Integer, default=5)
    tokens_estimate: Mapped[int] = mapped_column(Integer, default=0)

    payload_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

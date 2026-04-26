import datetime
from sqlalchemy import String, DateTime, Boolean, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(200), default="")
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    native_language: Mapped[str] = mapped_column(String(10), default="uk")
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    progress: Mapped[list["UserProgress"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    exercise_results: Mapped[list["UserExerciseResult"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    chat_sessions: Mapped[list["ChatSession"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    streak: Mapped["UserStreak | None"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    achievements: Mapped[list["UserAchievement"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    vocabulary: Mapped[list["UserVocabularyItem"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    expires_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True))
    used: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


from app.models.progress import UserProgress, UserExerciseResult, UserStreak, UserAchievement, UserVocabularyItem  # noqa: E402
from app.models.chat import ChatSession  # noqa: E402

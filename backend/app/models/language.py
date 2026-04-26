from sqlalchemy import String, Text, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Language(Base):
    __tablename__ = "languages"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(10), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    native_name: Mapped[str] = mapped_column(String(100), default="")
    flag_emoji: Mapped[str] = mapped_column(String(10), default="🌐")
    description: Mapped[str] = mapped_column(Text, default="")

    courses: Mapped[list["Course"]] = relationship(back_populates="language", cascade="all, delete-orphan")


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(primary_key=True)
    language_id: Mapped[int] = mapped_column(ForeignKey("languages.id"))
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    level: Mapped[str] = mapped_column(String(5))  # A1, A2, B1, B2, C1, C2
    order: Mapped[int] = mapped_column(Integer, default=0)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    language: Mapped["Language"] = relationship(back_populates="courses")
    lessons: Mapped[list["Lesson"]] = relationship(back_populates="course", cascade="all, delete-orphan")


from app.models.lesson import Lesson  # noqa: E402

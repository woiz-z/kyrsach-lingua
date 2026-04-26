import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.models.progress import UserProgress, UserVocabularyItem
from app.models.chat import ChatSession, ChatMessage
from app.models.daily_task import DailyTaskTemplate
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/daily-tasks", tags=["daily-tasks"])


class DailyTaskResponse(BaseModel):
    id: int
    task_type: str
    title: str
    description: str
    icon: str
    target_count: int
    xp_reward: int
    progress: int
    completed: bool


@router.get("/", response_model=list[DailyTaskResponse])
def get_daily_tasks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = datetime.date.today()
    tz = datetime.timezone.utc
    day_start = datetime.datetime.combine(today, datetime.time.min).replace(tzinfo=tz)
    day_end = datetime.datetime.combine(today, datetime.time.max).replace(tzinfo=tz)

    templates = db.query(DailyTaskTemplate).order_by(DailyTaskTemplate.id).all()

    result = []
    for t in templates:
        if t.task_type == "complete_lessons":
            raw = (
                db.query(sqlfunc.count(UserProgress.id))
                .filter(
                    UserProgress.user_id == current_user.id,
                    UserProgress.completed.is_(True),
                    UserProgress.completed_at >= day_start,
                    UserProgress.completed_at <= day_end,
                )
                .scalar() or 0
            )
        elif t.task_type == "vocab_review":
            raw = (
                db.query(sqlfunc.count(UserVocabularyItem.id))
                .filter(
                    UserVocabularyItem.user_id == current_user.id,
                    UserVocabularyItem.last_reviewed_at >= day_start,
                    UserVocabularyItem.last_reviewed_at <= day_end,
                )
                .scalar() or 0
            )
        elif t.task_type == "chat_messages":
            raw = (
                db.query(sqlfunc.count(ChatMessage.id))
                .join(ChatSession, ChatSession.id == ChatMessage.session_id)
                .filter(
                    ChatSession.user_id == current_user.id,
                    ChatMessage.role == "user",
                    ChatMessage.created_at >= day_start,
                    ChatMessage.created_at <= day_end,
                )
                .scalar() or 0
            )
        else:
            raw = 0

        progress = int(min(raw, t.target_count))
        result.append(DailyTaskResponse(
            id=t.id,
            task_type=t.task_type,
            title=t.title,
            description=t.description,
            icon=t.icon,
            target_count=t.target_count,
            xp_reward=t.xp_reward,
            progress=progress,
            completed=progress >= t.target_count,
        ))

    return result

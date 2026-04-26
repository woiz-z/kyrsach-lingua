from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc
from pydantic import BaseModel, Field
from app.database import get_db
from app.models.user import User
from app.models.progress import UserProgress
from app.models.language import Language
from app.services.ai_service import ai_service
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/ai-tools", tags=["ai-tools"])


# ─── Word Translation ────────────────────────────────────────────────────────

@router.get("/translate")
def translate_word(
    word: str = Query(..., min_length=1, max_length=300),
    source_lang: str = Query(default="en", min_length=2, max_length=10),
    target_lang: str = Query(default="uk", min_length=2, max_length=10),
    current_user: User = Depends(get_current_user),
):
    prompt = (
        f"Translate '{word}' from language ISO code '{source_lang}' "
        f"to language ISO code '{target_lang}'. "
        "Return ONLY the translation — no explanation, no punctuation beyond the word itself."
    )
    try:
        raw = ai_service.client.chat.completions.create(
            model=ai_service.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=80,
        )
        translation = ai_service._sanitize_output(raw.choices[0].message.content or "")
    except Exception:
        translation = ""
    return {"word": word, "translation": translation, "source_lang": source_lang, "target_lang": target_lang}


# ─── Personalized Learning Plan ──────────────────────────────────────────────

class LearningPlanRequest(BaseModel):
    language_code: str = Field(..., min_length=2, max_length=10)


class DayTask(BaseModel):
    type: str
    description: str
    duration_min: int = 10


class DayPlan(BaseModel):
    day: str
    tasks: list[DayTask]


class LearningPlanResponse(BaseModel):
    language_name: str
    recommended_level: str
    weekly_goal_xp: int
    tips: list[str]
    daily_plan: list[DayPlan]


@router.post("/learning-plan", response_model=LearningPlanResponse)
def generate_learning_plan(
    data: LearningPlanRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    language = db.query(Language).filter(Language.code == data.language_code).first()
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")

    total_xp = int(
        db.query(sqlfunc.coalesce(sqlfunc.sum(UserProgress.xp_earned), 0))
        .filter(UserProgress.user_id == current_user.id)
        .scalar() or 0
    )
    lessons_done = int(
        db.query(sqlfunc.count(UserProgress.id))
        .filter(UserProgress.user_id == current_user.id, UserProgress.completed.is_(True))
        .scalar() or 0
    )

    if total_xp < 100:
        level = "A1"
    elif total_xp < 300:
        level = "A2"
    elif total_xp < 700:
        level = "B1"
    elif total_xp < 1500:
        level = "B2"
    else:
        level = "C1"

    prompt = f"""Create a personalized 7-day {language.name} study plan.
Student: level={level}, xp={total_xp}, lessons_completed={lessons_done}.

Return ONLY valid JSON:
{{
  "recommended_level": "{level}",
  "weekly_goal_xp": 200,
  "tips": ["tip1", "tip2", "tip3"],
  "daily_plan": [
    {{
      "day": "Понеділок",
      "tasks": [
        {{"type": "lesson", "description": "...", "duration_min": 15}},
        {{"type": "vocab", "description": "...", "duration_min": 10}}
      ]
    }}
  ]
}}
Use Ukrainian for day names (Понеділок..Неділя) and task descriptions.
Include all 7 days. Task types: lesson, vocab, chat, review, pronunciation."""

    try:
        plan = ai_service.complete_json(prompt, temperature=0.6, max_tokens=2000)
        return LearningPlanResponse(
            language_name=language.name,
            recommended_level=plan.get("recommended_level", level),
            weekly_goal_xp=plan.get("weekly_goal_xp", 200),
            tips=plan.get("tips", []),
            daily_plan=[DayPlan(**d) for d in plan.get("daily_plan", [])],
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI error: {e}")

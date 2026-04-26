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
    topic: str = ""
    goal: str = ""


class DayPlan(BaseModel):
    day: str
    focus: str = ""
    tasks: list[DayTask]
    daily_goal: str = ""


class WeeklyMilestone(BaseModel):
    title: str
    description: str


class LearningResource(BaseModel):
    title: str
    type: str
    description: str


class LearningPlanResponse(BaseModel):
    language_name: str
    recommended_level: str
    weekly_goal_xp: int
    tips: list[str]
    daily_plan: list[DayPlan]
    milestones: list[WeeklyMilestone] = []
    resources: list[LearningResource] = []
    motivation_quote: str = ""


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

    prompt = f"""Create a highly detailed, personalized 7-day {language.name} study plan.
Student profile: level={level}, xp={total_xp}, lessons_completed={lessons_done}.

Return ONLY valid JSON matching this exact structure:
{{
  "recommended_level": "{level}",
  "weekly_goal_xp": 350,
  "motivation_quote": "An inspiring quote about language learning in Ukrainian",
  "tips": [
    "Specific actionable tip 1 for {language.name} learners at {level}",
    "Specific actionable tip 2 — pronunciation/script specific advice",
    "Specific actionable tip 3 — memory technique",
    "Specific actionable tip 4 — immersion strategy",
    "Specific actionable tip 5 — common mistake to avoid"
  ],
  "milestones": [
    {{"title": "Milestone by day 2", "description": "Concrete measurable goal"}},
    {{"title": "Milestone by day 4", "description": "Concrete measurable goal"}},
    {{"title": "Milestone by day 7", "description": "Concrete measurable goal"}}
  ],
  "resources": [
    {{"title": "Resource name", "type": "app/website/book/podcast", "description": "Why this resource for {language.name}"}},
    {{"title": "Resource name", "type": "app/website/book/podcast", "description": "Why this resource"}},
    {{"title": "Resource name", "type": "app/website/book/podcast", "description": "Why this resource"}}
  ],
  "daily_plan": [
    {{
      "day": "Понеділок",
      "focus": "Main theme of the day in Ukrainian",
      "daily_goal": "What the student should be able to do after today",
      "tasks": [
        {{
          "type": "lesson",
          "description": "Detailed description of what to study",
          "topic": "Specific grammar/vocabulary topic",
          "goal": "Concrete learning outcome",
          "duration_min": 20
        }},
        {{
          "type": "vocab",
          "description": "Specific words or phrases to learn",
          "topic": "Word category",
          "goal": "Know X new words",
          "duration_min": 15
        }},
        {{
          "type": "pronunciation",
          "description": "Specific sounds or patterns to practice",
          "topic": "Phonetic feature",
          "goal": "Pronunciation outcome",
          "duration_min": 10
        }}
      ]
    }}
  ]
}}

Rules:
- Use Ukrainian for all day names (Понеділок, Вівторок, Середа, Четвер, П'ятниця, Субота, Неділя) and descriptions.
- Include ALL 7 days, each with 3-4 tasks.
- Each task description must be SPECIFIC to {language.name} at {level} level (name actual topics, words, grammar rules).
- Task types to use: lesson, vocab, chat, review, pronunciation, reading, writing.
- Make each day have a different focus theme (e.g. greetings, numbers, food, transport...).
- Milestones must be concrete and measurable (e.g. "Know 50 words", "Conjugate 3 verb tenses").
- Resources must be real, well-known apps/sites for {language.name} learning.
- Tips must be specific to {language.name} script/grammar/culture."""

    try:
        plan = ai_service.complete_json(prompt, temperature=0.6, max_tokens=4000)
        return LearningPlanResponse(
            language_name=language.name,
            recommended_level=plan.get("recommended_level", level),
            weekly_goal_xp=plan.get("weekly_goal_xp", 350),
            tips=plan.get("tips", []),
            daily_plan=[DayPlan(**d) for d in plan.get("daily_plan", [])],
            milestones=[WeeklyMilestone(**m) for m in plan.get("milestones", [])],
            resources=[LearningResource(**r) for r in plan.get("resources", [])],
            motivation_quote=plan.get("motivation_quote", ""),
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI error: {e}")

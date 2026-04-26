from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from app.database import get_db
from app.models.language import Language
from app.services.ai_service import ai_service
from app.utils.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/placement-test", tags=["placement-test"])


class PlacementTestRequest(BaseModel):
    language_code: str = Field(..., min_length=2, max_length=10)


class PlacementQuestion(BaseModel):
    id: int
    level: str
    question: str
    options: list[str]
    correct_answer: str
    explanation: str


class PlacementTestGenerateResponse(BaseModel):
    language_code: str
    language_name: str
    questions: list[PlacementQuestion]


class PlacementTestSubmitRequest(BaseModel):
    language_code: str
    questions: list[PlacementQuestion]
    answers: list[str]


class PlacementTestResult(BaseModel):
    level: str
    score: int
    total: int
    feedback: str
    correct_per_level: dict[str, bool]


@router.post("/generate", response_model=PlacementTestGenerateResponse)
def generate_placement_test(
    data: PlacementTestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    language = db.query(Language).filter(Language.code == data.language_code).first()
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")

    prompt = f"""Generate a placement test for learning {language.name}.
Create exactly 5 multiple-choice questions, one for each level: A1, A2, B1, B2, C1.
Return ONLY valid JSON (no extra text):
{{
  "questions": [
    {{
      "id": 1,
      "level": "A1",
      "question": "...",
      "options": ["a", "b", "c", "d"],
      "correct_answer": "a",
      "explanation": "..."
    }}
  ]
}}
Rules:
- A1: basic greetings, numbers, colors
- A2: present/past tense, family words, everyday phrases
- B1: conditional, past perfect, idioms
- B2: nuanced grammar, complex sentences, phrasal verbs
- C1: advanced idioms, subjunctive, literary vocabulary
Each correct_answer MUST exactly match one of the options."""

    try:
        data_json = ai_service.complete_json(prompt, temperature=0.3, max_tokens=2000)
        questions = [PlacementQuestion(**q) for q in data_json["questions"]]
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI error: {e}")

    return PlacementTestGenerateResponse(
        language_code=data.language_code,
        language_name=language.name,
        questions=questions,
    )


@router.post("/evaluate", response_model=PlacementTestResult)
def evaluate_placement_test(
    data: PlacementTestSubmitRequest,
    current_user: User = Depends(get_current_user),
):
    if len(data.answers) != len(data.questions):
        raise HTTPException(status_code=400, detail="Answers count must match questions count")

    correct_per_level: dict[str, bool] = {}
    score = 0
    for q, answer in zip(data.questions, data.answers):
        is_correct = answer.strip().lower() == q.correct_answer.strip().lower()
        correct_per_level[q.level] = is_correct
        if is_correct:
            score += 1

    levels = ["A1", "A2", "B1", "B2", "C1"]
    determined_level = "A1"
    for lv in levels:
        if correct_per_level.get(lv, False):
            determined_level = lv

    if score == len(data.questions):
        determined_level = "C1+"

    feedback_map = {
        "A1": "Ви на початковому рівні. Починайте з базових уроків — вітань, цифр і кольорів.",
        "A2": "Ви знаєте основи. Вивчайте теперішній і минулий часи.",
        "B1": "Гарний середній рівень! Переходьте до складнішої граматики і читання.",
        "B2": "Вищий середній рівень. Практикуйте розмовну мову та підсистеми мови.",
        "C1": "Просунутий рівень. Фокусуйтесь на нюансах, ідіомах та академічному стилі.",
        "C1+": "Чудово! Ви вільно володієте мовою. Продовжуйте практикуватись!",
    }

    return PlacementTestResult(
        level=determined_level,
        score=score,
        total=len(data.questions),
        feedback=feedback_map.get(determined_level, "Рівень визначено."),
        correct_per_level=correct_per_level,
    )

import random
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
    correct_per_level: dict[str, int]  # count of correct answers per level (out of 5)


@router.post("/generate", response_model=PlacementTestGenerateResponse)
def generate_placement_test(
    data: PlacementTestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    language = db.query(Language).filter(Language.code == data.language_code).first()
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")

    # Random seed ensures unique questions each run
    seed = random.randint(1000, 9999)
    topic_hints = [
        "travel and transport", "food and cooking", "body and health", "home and furniture",
        "school and studies", "work and career", "nature and animals", "shopping and money",
        "sports and hobbies", "technology and internet", "culture and traditions", "weather and seasons",
    ]
    topic = random.choice(topic_hints)

    prompt = f"""Generate a NEW placement test (seed={seed}, topic_hint='{topic}') for learning {language.name}.
Create exactly 25 multiple-choice questions: 5 questions for each of the 5 levels A1, A2, B1, B2, C1 (ids 1-5 for A1, 6-10 for A2, 11-15 for B1, 16-20 for B2, 21-25 for C1).
Make ALL questions UNIQUE — use varied vocabulary, grammar structures, sentence types and topics.
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
Level rules (5 questions each, varied types — fill-in-the-blank, translation, error correction, choose correct form):
- A1 (ids 1-5): basic greetings, numbers, colors, articles, simple present
- A2 (ids 6-10): past simple, present continuous, family/food vocabulary, short dialogues
- B1 (ids 11-15): present perfect, conditionals, common idioms, prepositions
- B2 (ids 16-20): past perfect, phrasal verbs, nuanced grammar, passive voice
- C1 (ids 21-25): subjunctive, advanced idioms, literary vocabulary, complex sentence correction
Each correct_answer MUST exactly match one of the options (same string)."""

    try:
        data_json = ai_service.complete_json(prompt, temperature=0.85, max_tokens=8000)
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

    correct_per_level: dict[str, int] = {lv: 0 for lv in ["A1", "A2", "B1", "B2", "C1"]}
    score = 0
    for q, answer in zip(data.questions, data.answers):
        is_correct = answer.strip().lower() == q.correct_answer.strip().lower()
        if q.level in correct_per_level:
            if is_correct:
                correct_per_level[q.level] += 1
        if is_correct:
            score += 1

    # Count questions per level to determine pass threshold (majority: >50%)
    questions_per_level: dict[str, int] = {lv: 0 for lv in ["A1", "A2", "B1", "B2", "C1"]}
    for q in data.questions:
        if q.level in questions_per_level:
            questions_per_level[q.level] += 1

    levels = ["A1", "A2", "B1", "B2", "C1"]
    # Find highest consecutive pass from A1 upward.
    # A level is "passed" if more than half its questions were answered correctly.
    determined_level = "A1"
    for lv in levels:
        total_for_level = questions_per_level.get(lv, 1)
        pass_threshold = (total_for_level // 2) + 1  # majority, e.g. 3/5
        if correct_per_level.get(lv, 0) >= pass_threshold:
            determined_level = lv
        else:
            break

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

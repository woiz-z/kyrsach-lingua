import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.progress import UserVocabularyItem
from app.models.user import User
from app.schemas.progress import VocabularyItemCreate, VocabularyItemResponse, VocabularyReviewRequest
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/vocabulary", tags=["vocabulary"])


def _sm2_update(item: UserVocabularyItem, quality: int) -> None:
    """Apply SM-2 spaced repetition algorithm to update review schedule."""
    if quality < 3:
        # Incorrect — reset to beginning
        item.interval_days = 1
        item.ease_factor = max(1.3, item.ease_factor - 0.2)
    else:
        # Correct — advance interval
        if item.review_count == 0:
            item.interval_days = 1
        elif item.review_count == 1:
            item.interval_days = 6
        else:
            item.interval_days = max(1, round(item.interval_days * item.ease_factor))
        # Update ease factor: EF' = EF + (0.1 - (5-q)(0.08 + (5-q)*0.02))
        item.ease_factor = max(1.3, item.ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

    item.review_count += 1
    item.next_review_date = datetime.date.today() + datetime.timedelta(days=item.interval_days)
    item.last_reviewed_at = datetime.datetime.now(datetime.timezone.utc)


@router.get("/", response_model=list[VocabularyItemResponse])
def list_vocabulary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(UserVocabularyItem)
        .filter(UserVocabularyItem.user_id == current_user.id)
        .order_by(UserVocabularyItem.created_at.desc())
        .all()
    )


@router.post("/", response_model=VocabularyItemResponse, status_code=201)
def add_vocabulary_item(
    data: VocabularyItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = UserVocabularyItem(
        user_id=current_user.id,
        word=data.word.strip(),
        translation=data.translation.strip(),
        language_code=data.language_code.strip(),
        lesson_id=data.lesson_id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
def delete_vocabulary_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = (
        db.query(UserVocabularyItem)
        .filter(UserVocabularyItem.id == item_id, UserVocabularyItem.user_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Vocabulary item not found")
    db.delete(item)
    db.commit()


@router.get("/due", response_model=list[VocabularyItemResponse])
def get_due_items(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = datetime.date.today()
    return (
        db.query(UserVocabularyItem)
        .filter(
            UserVocabularyItem.user_id == current_user.id,
            UserVocabularyItem.next_review_date <= today,
        )
        .order_by(UserVocabularyItem.next_review_date)
        .all()
    )


@router.post("/{item_id}/review", response_model=VocabularyItemResponse)
def review_vocabulary_item(
    item_id: int,
    data: VocabularyReviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = (
        db.query(UserVocabularyItem)
        .filter(UserVocabularyItem.id == item_id, UserVocabularyItem.user_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Vocabulary item not found")

    _sm2_update(item, data.quality)
    db.commit()
    db.refresh(item)
    return item

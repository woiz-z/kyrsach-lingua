from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
import pycountry
from app.database import get_db
from app.models.language import Language, Course
from app.models.user import User
from app.schemas.lesson import LanguageResponse, CourseResponse
from app.utils.dependencies import get_current_user
from app.utils.language_flags import infer_flag_for_language_code

router = APIRouter(prefix="/api/languages", tags=["languages"])


class BootstrapLanguagesRequest(BaseModel):
    max_count: int = 0


class RefreshFlagsRequest(BaseModel):
    only_missing: bool = False


@router.get('/', response_model=list[LanguageResponse])
def get_languages(db: Session = Depends(get_db)):
    return db.query(Language).order_by(Language.name).all()


@router.get("/{language_id}", response_model=LanguageResponse)
def get_language(language_id: int, db: Session = Depends(get_db)):
    lang = db.query(Language).filter(Language.id == language_id).first()
    if not lang:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Language not found")
    return lang


@router.get("/{language_id}/courses", response_model=list[CourseResponse])
def get_courses(language_id: int, db: Session = Depends(get_db)):
    return db.query(Course).filter(Course.language_id == language_id).order_by(Course.order).all()


@router.post("/bootstrap-all")
def bootstrap_all_languages(
    data: BootstrapLanguagesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ = current_user
    _BLOCKED_LANG_CODES = {"ru"}  # removed by project policy
    existing_codes = {
        code for (code,) in db.query(Language.code).all() if isinstance(code, str)
    }

    # Collect ISO languages with 2-letter code to keep route compatibility and concise UI.
    candidates = []
    for lang in pycountry.languages:
        code = getattr(lang, "alpha_2", None)
        name = getattr(lang, "name", None)
        if not code or not name:
            continue
        code = str(code).lower()
        if code in existing_codes or code in _BLOCKED_LANG_CODES:
            continue
        candidates.append((code, str(name)))

    candidates.sort(key=lambda x: x[1].lower())

    if data.max_count and data.max_count > 0:
        candidates = candidates[: data.max_count]

    inserted = 0
    for code, name in candidates:
        db.add(
            Language(
                code=code,
                name=name,
                native_name=name,
                flag_emoji=infer_flag_for_language_code(code),
                description=f"Learn {name} with AI-generated adaptive lessons.",
            )
        )
        inserted += 1

    db.commit()
    total = db.query(Language).count()
    return {
        "message": "Languages catalog synchronized",
        "inserted": inserted,
        "total_languages": total,
    }


@router.post("/refresh-flags")
def refresh_language_flags(
    data: RefreshFlagsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ = current_user
    items = db.query(Language).all()
    updated = 0

    for lang in items:
        if data.only_missing and lang.flag_emoji and lang.flag_emoji != "🌐":
            continue

        next_flag = infer_flag_for_language_code(lang.code)
        if next_flag != (lang.flag_emoji or ""):
            lang.flag_emoji = next_flag
            updated += 1

    db.commit()

    return {
        "message": "Language flags refreshed",
        "updated": updated,
        "total_languages": len(items),
    }

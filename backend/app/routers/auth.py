import secrets
import datetime
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, PasswordResetToken
from app.models.progress import UserStreak
from app.schemas.user import (
    UserCreate, UserLogin, UserResponse, Token, UserUpdate,
    ForgotPasswordRequest, ResetPasswordRequest,
)
from app.utils.security import hash_password, verify_password, create_access_token
from app.utils.dependencies import get_current_user
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email.ilike(data.email)).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username.ilike(data.username)).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        email=data.email,
        username=data.username,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
    )
    db.add(user)
    db.flush()

    streak = UserStreak(user_id=user.id)
    db.add(streak)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return Token(access_token=token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email.ilike(data.email)).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id)})
    return Token(access_token=token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_me(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.full_name is not None:
        current_user.full_name = data.full_name.strip()
    if data.native_language is not None:
        current_user.native_language = data.native_language.strip()
    if data.username is not None:
        username = data.username.strip()
        if len(username) < 3:
            raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
        conflict = db.query(User).filter(User.username.ilike(username), User.id != current_user.id).first()
        if conflict:
            raise HTTPException(status_code=400, detail="Username already taken")
        current_user.username = username
    if data.email is not None:
        conflict = db.query(User).filter(User.email.ilike(data.email), User.id != current_user.id).first()
        if conflict:
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = data.email
    if data.avatar_url is not None:
        current_user.avatar_url = data.avatar_url
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(
    data: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Request a password-reset link. Always returns 200 to prevent user enumeration."""
    from app.services.email_service import send_password_reset_email

    user = db.query(User).filter(User.email.ilike(data.email)).first()
    if user:
        # Delete any existing unused tokens for this user
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used.is_(False),
        ).delete(synchronize_session=False)

        raw_token = secrets.token_urlsafe(32)
        expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=30)
        reset_token = PasswordResetToken(
            user_id=user.id,
            token=raw_token,
            expires_at=expires_at,
        )
        db.add(reset_token)
        db.commit()

        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={raw_token}"
        background_tasks.add_task(
            send_password_reset_email, user.email, reset_url, user.full_name
        )

    return {"message": "Якщо такий email існує, ми надіслали інструкції для скидання паролю."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Validate the reset token and set a new password."""
    now = datetime.datetime.now(datetime.timezone.utc)

    record = (
        db.query(PasswordResetToken)
        .filter(
            PasswordResetToken.token == data.token,
            PasswordResetToken.used.is_(False),
            PasswordResetToken.expires_at > now,
        )
        .first()
    )
    if not record:
        raise HTTPException(status_code=400, detail="Посилання недійсне або вже використане.")

    user = db.query(User).filter(User.id == record.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="Користувача не знайдено.")

    user.hashed_password = hash_password(data.new_password)
    record.used = True
    db.commit()

    return {"message": "Пароль успішно змінено. Тепер ви можете увійти."}

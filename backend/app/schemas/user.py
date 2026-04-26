from pydantic import BaseModel, EmailStr, field_validator
import datetime


class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: str = ""

    @field_validator('password')
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v

    @field_validator('username')
    @classmethod
    def username_min_length(cls, v: str) -> str:
        if len(v.strip()) < 3:
            raise ValueError('Username must be at least 3 characters')
        return v.strip()


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    full_name: str | None = None
    native_language: str | None = None
    username: str | None = None
    email: EmailStr | None = None
    avatar_url: str | None = None


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    avatar_url: str | None = None
    native_language: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator('new_password')
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v

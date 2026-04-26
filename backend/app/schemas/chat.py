from pydantic import BaseModel
import datetime


class ChatSessionCreate(BaseModel):
    language_id: int
    mode: str = "free_chat"
    title: str = "New Chat"


class ChatSessionResponse(BaseModel):
    id: int
    language_id: int
    title: str
    mode: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class ChatMessageCreate(BaseModel):
    content: str


class ChatMessageResponse(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

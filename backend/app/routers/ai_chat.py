from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage
from app.models.language import Language
from app.schemas.chat import ChatSessionCreate, ChatSessionResponse, ChatMessageCreate, ChatMessageResponse
from app.services.ai_service import ai_service
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/sessions", response_model=ChatSessionResponse, status_code=201)
def create_session(
    data: ChatSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    language = db.query(Language).filter(Language.id == data.language_id).first()
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")

    session = ChatSession(
        user_id=current_user.id,
        language_id=data.language_id,
        title=data.title,
        mode=data.mode,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/sessions", response_model=list[ChatSessionResponse])
def get_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.created_at.desc())
        .all()
    )


@router.get("/sessions/{session_id}/messages", response_model=list[ChatMessageResponse])
def get_messages(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session.messages


@router.post("/sessions/{session_id}/messages", response_model=ChatMessageResponse)
def send_message(
    session_id: int,
    data: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    language = db.query(Language).filter(Language.id == session.language_id).first()

    user_msg = ChatMessage(session_id=session_id, role="user", content=data.content)
    db.add(user_msg)
    db.commit()

    history = [{"role": m.role, "content": m.content} for m in session.messages]
    language_name = language.name
    chat_mode = session.mode
    target_session_id = session_id

    try:
        ai_response = ai_service.chat(history, session.mode, language.name)
    except Exception as e:
        ai_response = f"Sorry, I'm having trouble right now. Error: {str(e)[:100]}"

    assistant_msg = ChatMessage(session_id=session_id, role="assistant", content=ai_response)
    db.add(assistant_msg)

    if len(session.messages) <= 2 and session.title == "New Chat":
        session.title = data.content[:50]

    db.commit()
    db.refresh(assistant_msg)
    return assistant_msg


@router.post("/sessions/{session_id}/messages/stream")
def send_message_stream(
    session_id: int,
    data: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    language = db.query(Language).filter(Language.id == session.language_id).first()

    user_msg = ChatMessage(session_id=session_id, role="user", content=data.content)
    db.add(user_msg)
    db.commit()

    history = [{"role": m.role, "content": m.content} for m in session.messages]
    language_name = language.name
    chat_mode = session.mode
    target_session_id = session_id
    is_new_chat = session.title == "New Chat"

    collected: list[str] = []
    fallback_error: str | None = None
    client_disconnected = False

    def generate():
        try:
            for chunk in ai_service.chat_stream(history, chat_mode, language_name):
                collected.append(chunk)
                yield f"data: {chunk}\n\n"
        except GeneratorExit:
            nonlocal client_disconnected
            client_disconnected = True
            raise
        except Exception as e:
            nonlocal fallback_error
            fallback_error = f"Вибач, зараз не можу відповісти. Помилка: {str(e)[:120]}"
            yield f"data: {fallback_error}\n\n"
        finally:
            full_response = "".join(collected).strip()
            if not full_response and fallback_error:
                full_response = fallback_error

            if full_response:
                assistant_msg = ChatMessage(
                    session_id=target_session_id, role="assistant", content=full_response
                )
                new_db = SessionLocal()
                try:
                    new_db.add(assistant_msg)
                    if is_new_chat:
                        # Update session title to first user message (truncated)
                        first_user_msg = next(
                            (m["content"] for m in history if m["role"] == "user"), None
                        )
                        if first_user_msg:
                            sess = new_db.query(ChatSession).filter(
                                ChatSession.id == target_session_id
                            ).first()
                            if sess and sess.title == "New Chat":
                                sess.title = first_user_msg[:50]
                    new_db.commit()
                finally:
                    new_db.close()
            if not client_disconnected:
                yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.delete("/sessions/{session_id}")
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()
    return {"message": "Session deleted"}

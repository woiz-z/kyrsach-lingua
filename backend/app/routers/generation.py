import datetime
import logging
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db, SessionLocal
from app.models.generation import GenerationJob
from app.models.language import Course, Language
from app.models.lesson import Lesson, Exercise
from app.models.user import User
from app.schemas.generation import (
    ApproveGenerationResponse,
    GenerateLessonDraftRequest,
    GenerateCourseRequest,
    GenerateOnDemandExercisesRequest,
    GenerateOnDemandExercisesResponse,
    GenerationJobResponse,
    GenerationJobsListResponse,
    GenerationPreviewResponse,
    GenerationUsageStatsResponse,
    GeneratedLessonDraft,
)
from app.schemas.lesson import LessonResponse
from app.services.generation_service import generation_service
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/generation", tags=["generation"])
logger = logging.getLogger("linguaai.generation")


def _merge_job_payload(job: GenerationJob, **updates):
    payload = dict(job.payload_json or {})
    payload.update(updates)
    job.payload_json = payload


def _run_course_generation_job(
    *,
    job_id: int,
    course_id: int,
    language_id: int,
    user_id: int,
    title: str,
    focus: str,
    requested_level: str,
    course_language: str,
    lessons_count: int,
    exercises_per_lesson: int,
):
    db = SessionLocal()
    started_at = time.perf_counter()
    try:
        job = db.query(GenerationJob).filter(GenerationJob.id == job_id, GenerationJob.user_id == user_id).first()
        course = db.query(Course).filter(Course.id == course_id).first()
        language = db.query(Language).filter(Language.id == language_id).first()
        if not job or not course or not language:
            logger.error("[course_generate] background task missing entities job_id=%s course_id=%s language_id=%s", job_id, course_id, language_id)
            return

        logger.info(
            "[course_generate] started job_id=%s user_id=%s language_id=%s target_lang=%s course_lang=%s lessons=%s exercises_per_lesson=%s",
            job.id,
            user_id,
            language.id,
            language.name,
            course_language,
            lessons_count,
            exercises_per_lesson,
        )
        _merge_job_payload(
            job,
            progress_percent=5,
            progress_message="Плануємо структуру курсу",
            course_language=course_language,
            lessons_total=lessons_count,
            lessons_completed=0,
        )
        db.commit()

        plan_started_at = time.perf_counter()
        plan = generation_service.generate_course_plan(
            language_name=language.name,
            level=requested_level,
            title=title,
            focus=focus,
            lessons_count=lessons_count,
            course_language=course_language,
        )
        logger.info(
            "[course_generate] plan_ready job_id=%s lessons_in_plan=%s elapsed_ms=%s",
            job.id,
            len(plan.get("lessons", [])) if isinstance(plan, dict) else 0,
            int((time.perf_counter() - plan_started_at) * 1000),
        )

        course.title = plan["title"]
        course.description = plan["description"]
        course.level = requested_level
        _merge_job_payload(job, progress_percent=15, progress_message="План готовий, генеруємо уроки паралельно", lessons_total=actual_lessons_count)
        db.commit()

        lessons_in_plan = plan["lessons"]
        actual_lessons_count = len(lessons_in_plan)
        completed_count = 0
        completed_lock = threading.Lock()

        def _generate_one(idx: int, lesson_plan: dict) -> tuple[int, dict]:
            nonlocal completed_count
            lesson_topic = lesson_plan.get("topic", "") if isinstance(lesson_plan, dict) else ""
            logger.info(
                "[course_generate] lesson_started job_id=%s lesson_index=%s/%s topic=%s",
                job_id, idx, actual_lessons_count, lesson_topic,
            )
            draft = generation_service.generate_lesson_draft(
                language_name=language.name,
                level=requested_level,
                topic=lesson_plan["topic"],
                lesson_type=lesson_plan["lesson_type"],
                exercises_count=exercises_per_lesson,
                course_language=course_language,
            )
            with completed_lock:
                completed_count += 1
                done = completed_count
            logger.info(
                "[course_generate] lesson_done job_id=%s lesson_index=%s/%s done=%s",
                job_id, idx, actual_lessons_count, done,
            )
            # Update progress from the worker thread — each worker gets its own short-lived session
            try:
                from app.database import SessionLocal as _SL
                _db = _SL()
                _job = _db.query(GenerationJob).filter(GenerationJob.id == job_id).first()
                if _job:
                    pct = 15 + int((done / max(actual_lessons_count, 1)) * 80)
                    _merge_job_payload(
                        _job,
                        progress_percent=pct,
                        progress_message=f"Готово {done} з {actual_lessons_count} уроків",
                        lessons_completed=done,
                    )
                    _db.commit()
            except Exception:
                pass
            finally:
                try:
                    _db.close()
                except Exception:
                    pass
            return idx, draft

        # Limit to 3 concurrent workers so free-tier rate limits aren't hammered
        max_workers = min(actual_lessons_count, 3)
        drafts: dict[int, dict] = {}

        with ThreadPoolExecutor(max_workers=max_workers) as pool:
            futures = {
                pool.submit(_generate_one, idx, lp): idx
                for idx, lp in enumerate(lessons_in_plan[:actual_lessons_count], start=1)
            }
            for future in as_completed(futures):
                idx, draft = future.result()   # re-raises if the worker threw
                drafts[idx] = draft

        # Write all lessons + exercises to DB in plan order
        created_lessons: list[Lesson] = []
        for idx in range(1, actual_lessons_count + 1):
            draft = drafts[idx]
            lesson_plan = lessons_in_plan[idx - 1]
            lesson_topic = lesson_plan.get("topic", "") if isinstance(lesson_plan, dict) else ""

            lesson = Lesson(
                course_id=course.id,
                title=draft["title"],
                description=draft["description"],
                content=draft["content"],
                order=idx,
                lesson_type=draft["lesson_type"],
                xp_reward=draft["xp_reward"],
            )
            db.add(lesson)
            db.flush()

            for ex_idx, ex in enumerate(draft["exercises"], start=1):
                db.add(
                    Exercise(
                        lesson_id=lesson.id,
                        exercise_type=ex["exercise_type"],
                        question=ex["question"],
                        options=ex["options"],
                        correct_answer=ex["correct_answer"],
                        explanation=ex["explanation"],
                        hint=ex.get("hint", ""),
                        difficulty=ex.get("difficulty", "medium"),
                        points=ex["points"],
                        order=ex_idx,
                    )
                )
            created_lessons.append(lesson)
            logger.info(
                "[course_generate] lesson_written job_id=%s lesson_id=%s lesson_index=%s/%s exercises=%s",
                job_id, lesson.id, idx, actual_lessons_count,
                len(draft.get("exercises", [])) if isinstance(draft, dict) else 0,
            )
        db.commit()

        job.status = "approved"
        _merge_job_payload(
            job,
            progress_percent=100,
            progress_message="Курс згенеровано",
            course_id=course.id,
            lessons_count=len(created_lessons),
            plan=plan,
        )
        db.commit()
        logger.info(
            "[course_generate] completed job_id=%s course_id=%s lessons=%s total_elapsed_ms=%s",
            job.id,
            course.id,
            len(created_lessons),
            int((time.perf_counter() - started_at) * 1000),
        )
    except Exception as e:
        logger.exception(
            "[course_generate] failed job_id=%s course_id=%s elapsed_ms=%s error=%s",
            job_id,
            course_id,
            int((time.perf_counter() - started_at) * 1000),
            str(e),
        )
        db.rollback()
        failed_job = db.query(GenerationJob).filter(GenerationJob.id == job_id).first()
        failed_course = db.query(Course).filter(Course.id == course_id).first()
        if failed_job:
            failed_job.status = "failed"
            failed_job.error_message = str(e)[:500]
            _merge_job_payload(failed_job, progress_percent=100, progress_message="Генерація завершилась помилкою")
            if failed_course is not None:
                failed_job.course_id = None
            db.commit()
        if failed_course is not None:
            lesson_ids = [row[0] for row in db.query(Lesson.id).filter(Lesson.course_id == failed_course.id).all()]
            if lesson_ids:
                from app.models.progress import UserProgress, UserExerciseResult
                exercise_ids = [row[0] for row in db.query(Exercise.id).filter(Exercise.lesson_id.in_(lesson_ids)).all()]
                if exercise_ids:
                    db.query(UserExerciseResult).filter(UserExerciseResult.exercise_id.in_(exercise_ids)).delete(synchronize_session=False)
                db.query(Exercise).filter(Exercise.lesson_id.in_(lesson_ids)).delete(synchronize_session=False)
                db.query(UserProgress).filter(UserProgress.lesson_id.in_(lesson_ids)).delete(synchronize_session=False)
                db.query(Lesson).filter(Lesson.id.in_(lesson_ids)).delete(synchronize_session=False)
            db.delete(failed_course)
            db.commit()
    finally:
        db.close()


def _today_start_utc() -> datetime.datetime:
    now = datetime.datetime.now(datetime.timezone.utc)
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


def _ensure_daily_limit(db: Session, user_id: int):
    used = (
        db.query(GenerationJob)
        .filter(
            GenerationJob.user_id == user_id,
            GenerationJob.created_at >= _today_start_utc(),
        )
        .count()
    )
    if used >= settings.AI_GENERATION_MAX_DRAFTS_PER_DAY:
        raise HTTPException(status_code=429, detail="Daily AI generation limit reached")


@router.post("/lessons/draft", response_model=GenerationJobResponse)
def generate_lesson_draft(
    data: GenerateLessonDraftRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_daily_limit(db, current_user.id)

    course = db.query(Course).filter(Course.id == data.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    exercises_count = max(1, min(data.exercises_count, settings.AI_GENERATION_MAX_EXERCISES_PER_REQUEST))
    requested_level = (data.target_level or course.level).strip()[:10]

    job = GenerationJob(
        user_id=current_user.id,
        course_id=course.id,
        job_type="lesson_draft",
        status="running",
        topic=data.topic.strip(),
        requested_level=requested_level,
        lesson_type=data.lesson_type.strip().lower(),
        exercises_count=exercises_count,
        tokens_estimate=exercises_count * 220,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    try:
        payload = generation_service.generate_lesson_draft(
            language_name=course.language.name,
            level=requested_level,
            topic=job.topic,
            lesson_type=job.lesson_type,
            exercises_count=exercises_count,
        )
        job.status = "draft_ready"
        job.payload_json = payload
    except Exception as e:
        job.status = "failed"
        job.error_message = str(e)[:500]

    db.commit()
    db.refresh(job)
    return job


@router.post("/languages/{language_id}/courses", response_model=GenerationJobResponse)
def generate_course_for_language(
    language_id: int,
    data: GenerateCourseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_daily_limit(db, current_user.id)

    language = db.query(Language).filter(Language.id == language_id).first()
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")

    lessons_count = max(1, min(data.lessons_count, settings.AI_GENERATION_MAX_COURSE_LESSONS))
    exercises_per_lesson = max(1, min(data.exercises_per_lesson, settings.AI_GENERATION_MAX_EXERCISES_PER_REQUEST))
    course_language = (data.course_language or current_user.native_language or "Ukrainian").strip()[:100]

    max_course_order = (
        db.query(Course.order)
        .filter(Course.language_id == language.id)
        .order_by(Course.order.desc())
        .first()
    )
    course_order = (max_course_order[0] + 1) if max_course_order else 1

    # Persist placeholder course first so generation job has a valid FK target.
    course = Course(
        language_id=language.id,
        title=data.title.strip()[:200],
        description=data.focus.strip()[:2000],
        level=data.level.strip()[:10].upper(),
        order=course_order,
    )
    db.add(course)
    db.flush()

    job = GenerationJob(
        user_id=current_user.id,
        course_id=course.id,
        job_type="course_generate",
        status="running",
        topic=data.focus.strip()[:255],
        requested_level=data.level.strip()[:10].upper(),
        lesson_type="mixed",
        exercises_count=lessons_count * exercises_per_lesson,
        tokens_estimate=lessons_count * exercises_per_lesson * 220,
    )
    db.add(job)
    db.commit()
    db.refresh(course)
    db.refresh(job)

    _merge_job_payload(
        job,
        progress_percent=0,
        progress_message="Задачу поставлено в чергу",
        course_language=course_language,
        lessons_total=lessons_count,
        lessons_completed=0,
        language_name=language.name,
        language_flag=language.flag_emoji,
        course_title=data.title.strip(),
    )
    db.commit()
    db.refresh(job)

    t = threading.Thread(
        target=_run_course_generation_job,
        kwargs=dict(
            job_id=job.id,
            course_id=course.id,
            language_id=language.id,
            user_id=current_user.id,
            title=data.title,
            focus=data.focus,
            requested_level=job.requested_level,
            course_language=course_language,
            lessons_count=lessons_count,
            exercises_per_lesson=exercises_per_lesson,
        ),
        daemon=True,
    )
    t.start()

    return job


@router.get("/jobs/{job_id}", response_model=GenerationJobResponse)
def get_generation_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = (
        db.query(GenerationJob)
        .filter(GenerationJob.id == job_id, GenerationJob.user_id == current_user.id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Generation job not found")
    return job


@router.get("/jobs", response_model=GenerationJobsListResponse)
def list_generation_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = (
        db.query(GenerationJob)
        .filter(GenerationJob.user_id == current_user.id)
        .order_by(GenerationJob.created_at.desc())
        .limit(50)
        .all()
    )
    return GenerationJobsListResponse(items=items, total=len(items))


@router.delete("/jobs/{job_id}", status_code=204)
def dismiss_generation_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cancel a running/failed generation job and clean up its orphan course."""
    job = (
        db.query(GenerationJob)
        .filter(GenerationJob.id == job_id, GenerationJob.user_id == current_user.id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Generation job not found")
    if job.status not in {"running", "failed"}:
        raise HTTPException(status_code=409, detail="Only running or failed jobs can be dismissed")

    # Delete orphan course if it still exists and has no lessons yet
    if job.course_id:
        course = db.query(Course).filter(Course.id == job.course_id).first()
        if course:
            lesson_count = db.query(Lesson).filter(Lesson.course_id == course.id).count()
            if lesson_count == 0:
                db.delete(course)
            job.course_id = None

    job.status = "cancelled"
    _merge_job_payload(job, progress_message="Скасовано користувачем")
    db.commit()


@router.get("/jobs/{job_id}/preview", response_model=GenerationPreviewResponse)
def preview_generation_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = (
        db.query(GenerationJob)
        .filter(GenerationJob.id == job_id, GenerationJob.user_id == current_user.id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Generation job not found")

    if job.status not in {"draft_ready", "approved"} or not isinstance(job.payload_json, dict):
        raise HTTPException(status_code=409, detail="Draft is not ready yet")

    draft = GeneratedLessonDraft.model_validate(job.payload_json)
    return GenerationPreviewResponse(job=job, draft=draft)


@router.post("/jobs/{job_id}/approve", response_model=ApproveGenerationResponse)
def approve_generation_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = (
        db.query(GenerationJob)
        .filter(GenerationJob.id == job_id, GenerationJob.user_id == current_user.id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Generation job not found")

    if job.status == "approved" and job.approved_lesson_id:
        lesson = db.query(Lesson).filter(Lesson.id == job.approved_lesson_id).first()
        if lesson:
            return ApproveGenerationResponse(job=job, lesson=LessonResponse.model_validate(lesson))

    if job.status != "draft_ready" or not isinstance(job.payload_json, dict):
        raise HTTPException(status_code=409, detail="Draft is not ready for approval")

    payload = GeneratedLessonDraft.model_validate(job.payload_json)

    max_order = (
        db.query(Lesson.order)
        .filter(Lesson.course_id == job.course_id)
        .order_by(Lesson.order.desc())
        .first()
    )
    next_order = (max_order[0] + 1) if max_order else 1

    lesson = Lesson(
        course_id=job.course_id,
        title=payload.title,
        description=payload.description,
        content=payload.content.model_dump(),
        order=next_order,
        lesson_type=payload.lesson_type,
        xp_reward=payload.xp_reward,
    )
    db.add(lesson)
    db.flush()

    for idx, ex in enumerate(payload.exercises, start=1):
        db.add(
            Exercise(
                lesson_id=lesson.id,
                exercise_type=ex.exercise_type,
                question=ex.question,
                options=ex.options,
                correct_answer=ex.correct_answer,
                explanation=ex.explanation,
                hint=ex.hint,
                difficulty=ex.difficulty,
                points=ex.points,
                order=idx,
            )
        )

    db.commit()
    db.refresh(lesson)

    job.status = "approved"
    job.approved_lesson_id = lesson.id
    db.commit()
    db.refresh(job)

    return ApproveGenerationResponse(job=job, lesson=LessonResponse.model_validate(lesson))


@router.post("/jobs/{job_id}/reject", response_model=GenerationJobResponse)
def reject_generation_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = (
        db.query(GenerationJob)
        .filter(GenerationJob.id == job_id, GenerationJob.user_id == current_user.id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Generation job not found")

    if job.status == "approved":
        raise HTTPException(status_code=409, detail="Approved generation cannot be rejected")

    job.status = "rejected"
    db.commit()
    db.refresh(job)
    return job


@router.post(
    "/lessons/{lesson_id}/exercises/on-demand",
    response_model=GenerateOnDemandExercisesResponse,
)
def generate_on_demand_exercises(
    lesson_id: int,
    data: GenerateOnDemandExercisesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_daily_limit(db, current_user.id)

    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    course = db.query(Course).filter(Course.id == lesson.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    exercises_count = max(1, min(data.exercises_count, settings.AI_GENERATION_MAX_EXERCISES_PER_REQUEST))

    job = GenerationJob(
        user_id=current_user.id,
        course_id=course.id,
        approved_lesson_id=lesson.id,
        job_type="exercise_on_demand",
        status="running",
        topic=(data.topic_hint or lesson.title).strip()[:255],
        requested_level=course.level,
        lesson_type=lesson.lesson_type,
        exercises_count=exercises_count,
        tokens_estimate=exercises_count * 120,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    try:
        generated = generation_service.generate_on_demand_exercises(
            language_name=course.language.name,
            level=course.level,
            lesson_title=lesson.title,
            lesson_content=lesson.content,
            topic_hint=data.topic_hint,
            exercises_count=exercises_count,
        )

        max_order = (
            db.query(Exercise.order)
            .filter(Exercise.lesson_id == lesson.id)
            .order_by(Exercise.order.desc())
            .first()
        )
        next_order = (max_order[0] + 1) if max_order else 1

        created: list[Exercise] = []
        for idx, ex in enumerate(generated, start=0):
            row = Exercise(
                lesson_id=lesson.id,
                exercise_type=ex["exercise_type"],
                question=ex["question"],
                options=ex["options"],
                correct_answer=ex["correct_answer"],
                explanation=ex["explanation"],
                hint=ex.get("hint", ""),
                difficulty=ex.get("difficulty", "medium"),
                points=ex["points"],
                order=next_order + idx,
            )
            db.add(row)
            created.append(row)

        db.flush()

        job.status = "approved"
        job.payload_json = {"generated_exercise_ids": [item.id for item in created]}
        db.commit()

        for row in created:
            db.refresh(row)

        db.refresh(job)
        return GenerateOnDemandExercisesResponse(job=job, exercises=created)
    except Exception as e:
        job.status = "failed"
        job.error_message = str(e)[:500]
        db.commit()
        db.refresh(job)
        raise HTTPException(status_code=502, detail=f"Exercise generation failed: {job.error_message}")


@router.get("/usage/stats", response_model=GenerationUsageStatsResponse)
def generation_usage_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    used_today = (
        db.query(GenerationJob)
        .filter(
            GenerationJob.user_id == current_user.id,
            GenerationJob.created_at >= _today_start_utc(),
        )
        .count()
    )

    total_jobs = db.query(GenerationJob).filter(GenerationJob.user_id == current_user.id).count()
    drafts_ready = (
        db.query(GenerationJob)
        .filter(GenerationJob.user_id == current_user.id, GenerationJob.status == "draft_ready")
        .count()
    )
    approved = (
        db.query(GenerationJob)
        .filter(GenerationJob.user_id == current_user.id, GenerationJob.status == "approved")
        .count()
    )
    failed = (
        db.query(GenerationJob)
        .filter(GenerationJob.user_id == current_user.id, GenerationJob.status == "failed")
        .count()
    )

    return GenerationUsageStatsResponse(
        daily_limit=settings.AI_GENERATION_MAX_DRAFTS_PER_DAY,
        used_today=used_today,
        remaining_today=max(settings.AI_GENERATION_MAX_DRAFTS_PER_DAY - used_today, 0),
        total_jobs=total_jobs,
        drafts_ready=drafts_ready,
        approved=approved,
        failed=failed,
    )

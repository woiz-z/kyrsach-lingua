from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.lesson import Lesson, Exercise
from app.models.language import Course
from app.models.generation import GenerationJob
from app.models.progress import UserProgress, UserExerciseResult, Achievement, UserAchievement, UserStreak
from app.models.user import User
from app.schemas.lesson import CourseResponse, LessonResponse, ExerciseResponse, ExerciseSubmit, ExerciseResult
from app.utils.dependencies import get_current_user
import datetime

router = APIRouter(prefix="/api", tags=["lessons"])


def _check_and_award_achievements(db: Session, user_id: int, streak: int) -> None:
    """Check all achievement conditions and award any newly earned ones."""
    # Gather current stats
    lessons_done = (
        db.query(UserProgress)
        .filter(UserProgress.user_id == user_id, UserProgress.completed.is_(True))
        .count()
    )
    exercises_done = (
        db.query(UserExerciseResult)
        .filter(UserExerciseResult.user_id == user_id)
        .count()
    )
    from sqlalchemy import func as sqlfunc
    total_xp = (
        db.query(sqlfunc.coalesce(sqlfunc.sum(UserProgress.xp_earned), 0))
        .filter(UserProgress.user_id == user_id)
        .scalar()
    )

    already_earned_ids = {
        row.achievement_id
        for row in db.query(UserAchievement.achievement_id)
        .filter(UserAchievement.user_id == user_id)
        .all()
    }

    stat_map = {"lessons": lessons_done, "exercises": exercises_done, "xp": total_xp, "streak": streak}

    for achievement in db.query(Achievement).all():
        if achievement.id in already_earned_ids:
            continue
        current_val = stat_map.get(achievement.condition_type, 0)
        if current_val >= achievement.condition_value:
            db.add(UserAchievement(user_id=user_id, achievement_id=achievement.id))


@router.get("/courses/{course_id}", response_model=CourseResponse)
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.delete("/courses/{course_id}")
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ = current_user
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    lesson_ids = [row[0] for row in db.query(Lesson.id).filter(Lesson.course_id == course_id).all()]
    exercise_ids: list[int] = []
    if lesson_ids:
        exercise_ids = [row[0] for row in db.query(Exercise.id).filter(Exercise.lesson_id.in_(lesson_ids)).all()]

    if exercise_ids:
        db.query(UserExerciseResult).filter(UserExerciseResult.exercise_id.in_(exercise_ids)).delete(synchronize_session=False)
    if lesson_ids:
        db.query(UserProgress).filter(UserProgress.lesson_id.in_(lesson_ids)).delete(synchronize_session=False)
        db.query(GenerationJob).filter(GenerationJob.approved_lesson_id.in_(lesson_ids)).delete(synchronize_session=False)
        db.query(Exercise).filter(Exercise.lesson_id.in_(lesson_ids)).delete(synchronize_session=False)
        db.query(Lesson).filter(Lesson.id.in_(lesson_ids)).delete(synchronize_session=False)

    db.query(GenerationJob).filter(GenerationJob.course_id == course_id).delete(synchronize_session=False)
    db.delete(course)
    db.commit()

    return {"message": "Course deleted", "course_id": course_id, "language_id": course.language_id}


@router.get("/courses/{course_id}/lessons", response_model=list[LessonResponse])
def get_lessons(course_id: int, db: Session = Depends(get_db)):
    return db.query(Lesson).filter(Lesson.course_id == course_id).order_by(Lesson.order).all()


@router.get("/lessons/{lesson_id}", response_model=LessonResponse)
def get_lesson(lesson_id: int, db: Session = Depends(get_db)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson


@router.get("/lessons/{lesson_id}/exercises", response_model=list[ExerciseResponse])
def get_exercises(lesson_id: int, db: Session = Depends(get_db)):
    return db.query(Exercise).filter(Exercise.lesson_id == lesson_id).order_by(Exercise.order).all()


@router.post("/exercises/{exercise_id}/submit", response_model=ExerciseResult)
def submit_exercise(
    exercise_id: int,
    data: ExerciseSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    is_correct = data.answer.strip().lower() == exercise.correct_answer.strip().lower()
    points = exercise.points if is_correct else 0

    result = UserExerciseResult(
        user_id=current_user.id,
        exercise_id=exercise_id,
        user_answer=data.answer,
        is_correct=is_correct,
    )
    db.add(result)
    db.commit()

    return ExerciseResult(
        is_correct=is_correct,
        correct_answer=exercise.correct_answer,
        explanation=exercise.explanation,
        points_earned=points,
    )


@router.post("/lessons/{lesson_id}/complete")
def complete_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    progress = (
        db.query(UserProgress)
        .filter(UserProgress.user_id == current_user.id, UserProgress.lesson_id == lesson_id)
        .first()
    )

    exercises = db.query(Exercise).filter(Exercise.lesson_id == lesson_id).all()
    exercise_ids = [e.id for e in exercises]
    results = (
        db.query(UserExerciseResult)
        .filter(
            UserExerciseResult.user_id == current_user.id,
            UserExerciseResult.exercise_id.in_(exercise_ids),
        )
        .all()
    ) if exercise_ids else []

    correct = sum(1 for r in results if r.is_correct)
    total = len(results) if results else 0
    score = int((correct / total) * 100) if total > 0 else 0

    if progress:
        progress.completed = True
        progress.score = max(progress.score, score)
        progress.xp_earned = max(progress.xp_earned, lesson.xp_reward)
        progress.completed_at = datetime.datetime.now(datetime.timezone.utc)
    else:
        progress = UserProgress(
            user_id=current_user.id,
            lesson_id=lesson_id,
            completed=True,
            score=score,
            xp_earned=lesson.xp_reward,
            completed_at=datetime.datetime.now(datetime.timezone.utc),
        )
        db.add(progress)

    # Update streak
    streak = db.query(UserStreak).filter(UserStreak.user_id == current_user.id).first()
    today = datetime.datetime.now(datetime.timezone.utc).date()
    if streak:
        if streak.last_activity_date is None or streak.last_activity_date < today:
            if streak.last_activity_date == today - datetime.timedelta(days=1):
                streak.current_streak += 1
            elif streak.last_activity_date != today:
                streak.current_streak = 1
            streak.last_activity_date = today
            streak.longest_streak = max(streak.longest_streak, streak.current_streak)

    db.commit()

    current_streak = streak.current_streak if streak else 0
    _check_and_award_achievements(db, current_user.id, current_streak)
    db.commit()

    return {"message": "Lesson completed", "score": score, "xp_earned": lesson.xp_reward}

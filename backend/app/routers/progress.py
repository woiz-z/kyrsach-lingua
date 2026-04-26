from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc, case
from app.database import get_db
from app.models.user import User
from app.models.progress import UserProgress, UserExerciseResult, UserStreak, UserAchievement, Achievement
from app.models.lesson import Lesson, Exercise
from app.models.language import Course, Language
from app.models.generation import GenerationJob
from app.schemas.progress import (
    StatsResponse, StreakResponse, AchievementResponse, ProgressResponse,
    LeaderboardEntry, ReviewExercisesResponse, CourseProgressSummary,
    MyCoursesPageResponse,
)
from app.schemas.lesson import ExerciseResponse
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/progress", tags=["progress"])


@router.get("/", response_model=list[ProgressResponse])
def get_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(UserProgress, Lesson.course_id)
        .join(Lesson, Lesson.id == UserProgress.lesson_id)
        .filter(UserProgress.user_id == current_user.id)
        .order_by(UserProgress.completed_at.desc())
        .all()
    )
    return [
        ProgressResponse(
            id=progress.id,
            user_id=progress.user_id,
            lesson_id=progress.lesson_id,
            course_id=course_id,
            completed=progress.completed,
            score=progress.score,
            xp_earned=progress.xp_earned,
            completed_at=progress.completed_at,
        )
        for progress, course_id in rows
    ]


@router.get("/courses", response_model=list[CourseProgressSummary])
def get_user_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all courses the user has made any progress in, with per-course stats.
    Uses a single aggregation query instead of per-course loops (eliminates N+1)."""
    # Single aggregation query: one row per course_id
    agg_rows = (
        db.query(
            Lesson.course_id,
            sqlfunc.count(UserProgress.id).label("lessons_progress_count"),
            sqlfunc.count(
                sqlfunc.nullif(UserProgress.completed, False)
            ).label("lessons_completed"),
            sqlfunc.coalesce(sqlfunc.sum(UserProgress.xp_earned), 0).label("xp_earned"),
            sqlfunc.max(UserProgress.completed_at).label("last_activity"),
        )
        .join(UserProgress, UserProgress.lesson_id == Lesson.id)
        .filter(UserProgress.user_id == current_user.id)
        .group_by(Lesson.course_id)
        .all()
    )
    if not agg_rows:
        return []

    course_ids = [row.course_id for row in agg_rows]

    # Fetch all needed courses + languages in two queries
    courses_map = {
        c.id: c for c in db.query(Course).filter(Course.id.in_(course_ids)).all()
    }
    language_ids = list({c.language_id for c in courses_map.values()})
    languages_map = {
        lang.id: lang for lang in db.query(Language).filter(Language.id.in_(language_ids)).all()
    }

    # Lessons total per course: single query
    total_rows = (
        db.query(Lesson.course_id, sqlfunc.count(Lesson.id).label("total"))
        .filter(Lesson.course_id.in_(course_ids))
        .group_by(Lesson.course_id)
        .all()
    )
    lessons_total_map = {row.course_id: row.total for row in total_rows}

    result = []
    for row in agg_rows:
        course = courses_map.get(row.course_id)
        if not course:
            continue
        language = languages_map.get(course.language_id)
        result.append(CourseProgressSummary(
            course_id=row.course_id,
            title=course.title,
            description=course.description,
            level=course.level,
            language_id=course.language_id,
            language_name=language.name if language else "",
            language_flag=language.flag_emoji if language else "🌐",
            lessons_total=lessons_total_map.get(row.course_id, 0),
            lessons_completed=int(row.lessons_completed),
            xp_earned=int(row.xp_earned),
            last_activity=row.last_activity,
        ))

    result.sort(key=lambda x: x.last_activity or 0, reverse=True)  # type: ignore[arg-type]
    return result


@router.get("/my-courses", response_model=MyCoursesPageResponse)
def get_my_courses(
    search: str | None = Query(None, max_length=100),
    level: str | None = Query(None),
    language_id: int | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all courses the user generated or has any progress in, with search/filter/pagination."""
    # Course IDs from generation jobs (approved courses this user generated)
    gen_course_ids = {
        row.course_id
        for row in db.query(GenerationJob.course_id)
        .filter(
            GenerationJob.user_id == current_user.id,
            GenerationJob.job_type == "course_generate",
            GenerationJob.status == "approved",
            GenerationJob.course_id.isnot(None),
        )
        .all()
        if row.course_id is not None
    }

    # Course IDs from user progress (courses user has started)
    progress_course_ids = {
        row.course_id
        for row in db.query(Lesson.course_id)
        .join(UserProgress, UserProgress.lesson_id == Lesson.id)
        .filter(UserProgress.user_id == current_user.id)
        .distinct()
        .all()
    }

    all_course_ids = gen_course_ids | progress_course_ids
    if not all_course_ids:
        return MyCoursesPageResponse(items=[], total=0, page=page, pages=0)

    # Base course query
    q = db.query(Course).filter(Course.id.in_(all_course_ids))

    if search:
        q = (
            q.join(Language, Language.id == Course.language_id)
            .filter(
                Course.title.ilike(f"%{search}%") | Language.name.ilike(f"%{search}%")
            )
        )

    if level:
        q = q.filter(Course.level == level)

    if language_id:
        q = q.filter(Course.language_id == language_id)

    total = q.count()
    pages = max(1, (total + page_size - 1) // page_size)
    courses_list = q.offset((page - 1) * page_size).limit(page_size).all()

    if not courses_list:
        return MyCoursesPageResponse(items=[], total=total, page=page, pages=pages)

    fetched_ids = [c.id for c in courses_list]

    # Progress stats (left-join semantics via separate query)
    agg_rows = (
        db.query(
            Lesson.course_id,
            sqlfunc.count(sqlfunc.nullif(UserProgress.completed, False)).label("lessons_completed"),
            sqlfunc.coalesce(sqlfunc.sum(UserProgress.xp_earned), 0).label("xp_earned"),
            sqlfunc.max(UserProgress.completed_at).label("last_activity"),
        )
        .join(UserProgress, UserProgress.lesson_id == Lesson.id)
        .filter(
            UserProgress.user_id == current_user.id,
            Lesson.course_id.in_(fetched_ids),
        )
        .group_by(Lesson.course_id)
        .all()
    )
    progress_map = {row.course_id: row for row in agg_rows}

    total_rows = (
        db.query(Lesson.course_id, sqlfunc.count(Lesson.id).label("total"))
        .filter(Lesson.course_id.in_(fetched_ids))
        .group_by(Lesson.course_id)
        .all()
    )
    lessons_total_map = {row.course_id: row.total for row in total_rows}

    lang_ids = list({c.language_id for c in courses_list})
    languages_map = {
        lang.id: lang for lang in db.query(Language).filter(Language.id.in_(lang_ids)).all()
    }

    items = []
    for course in courses_list:
        language = languages_map.get(course.language_id)
        prog = progress_map.get(course.id)
        items.append(CourseProgressSummary(
            course_id=course.id,
            title=course.title,
            description=course.description or "",
            level=course.level,
            language_id=course.language_id,
            language_name=language.name if language else "",
            language_flag=language.flag_emoji if language else "🌐",
            lessons_total=lessons_total_map.get(course.id, 0),
            lessons_completed=int(prog.lessons_completed) if prog else 0,
            xp_earned=int(prog.xp_earned) if prog else 0,
            last_activity=prog.last_activity if prog else None,
        ))

    # Sort: courses with recent activity first, then newest (by course.id) first
    items.sort(key=lambda x: (
        0 if x.last_activity else 1,
        -(x.last_activity.timestamp() if x.last_activity else 0),
    ))

    return MyCoursesPageResponse(items=items, total=total, page=page, pages=pages)


@router.get("/stats", response_model=StatsResponse)
def get_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    total_xp = (
        db.query(sqlfunc.coalesce(sqlfunc.sum(UserProgress.xp_earned), 0))
        .filter(UserProgress.user_id == current_user.id)
        .scalar()
    )
    lessons_completed = (
        db.query(sqlfunc.count(UserProgress.id))
        .filter(UserProgress.user_id == current_user.id, UserProgress.completed.is_(True))
        .scalar()
    )
    exercises_completed = (
        db.query(sqlfunc.count(UserExerciseResult.id))
        .filter(UserExerciseResult.user_id == current_user.id)
        .scalar()
    )
    exercises_correct = (
        db.query(sqlfunc.count(UserExerciseResult.id))
        .filter(UserExerciseResult.user_id == current_user.id, UserExerciseResult.is_correct.is_(True))
        .scalar()
    )
    languages_studying = (
        db.query(sqlfunc.count(sqlfunc.distinct(Lesson.course_id)))
        .join(UserProgress, UserProgress.lesson_id == Lesson.id)
        .filter(UserProgress.user_id == current_user.id, UserProgress.completed.is_(True))
        .scalar()
    )
    accuracy = (exercises_correct / exercises_completed * 100) if exercises_completed > 0 else 0.0

    streak = db.query(UserStreak).filter(UserStreak.user_id == current_user.id).first()
    achievements_count = (
        db.query(sqlfunc.count(UserAchievement.id))
        .filter(UserAchievement.user_id == current_user.id)
        .scalar()
    )

    return StatsResponse(
        total_xp=total_xp,
        lessons_completed=lessons_completed,
        exercises_completed=exercises_completed,
        exercises_correct=exercises_correct,
        accuracy=round(accuracy, 1),
        languages_studying=languages_studying,
        current_streak=streak.current_streak if streak else 0,
        longest_streak=streak.longest_streak if streak else 0,
        achievements_count=achievements_count,
    )


@router.get("/streak", response_model=StreakResponse)
def get_streak(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    streak = db.query(UserStreak).filter(UserStreak.user_id == current_user.id).first()
    if not streak:
        return StreakResponse(current_streak=0, longest_streak=0)
    return StreakResponse(
        current_streak=streak.current_streak,
        longest_streak=streak.longest_streak,
        last_activity_date=streak.last_activity_date,
    )


@router.get("/achievements/all")
def get_all_achievements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    all_achievements = db.query(Achievement).order_by(Achievement.id).all()
    earned_map = {
        ua.achievement_id: ua.earned_at
        for ua in db.query(UserAchievement).filter(UserAchievement.user_id == current_user.id).all()
    }
    return [
        {
            "id": a.id,
            "name": a.name,
            "description": a.description,
            "icon": a.icon,
            "condition_type": a.condition_type,
            "condition_value": a.condition_value,
            "earned": a.id in earned_map,
            "earned_at": earned_map.get(a.id),
        }
        for a in all_achievements
    ]


@router.get("/achievements", response_model=list[AchievementResponse])
def get_achievements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_achievements = (
        db.query(UserAchievement)
        .filter(UserAchievement.user_id == current_user.id)
        .all()
    )
    return [
        AchievementResponse(
            id=ua.achievement.id,
            name=ua.achievement.name,
            description=ua.achievement.description,
            icon=ua.achievement.icon,
            earned_at=ua.earned_at,
        )
        for ua in user_achievements
    ]


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
def get_leaderboard(
    limit: int = Query(default=10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(
            User.id,
            User.username,
            User.avatar_url,
            sqlfunc.coalesce(sqlfunc.sum(UserProgress.xp_earned), 0).label("total_xp"),
            sqlfunc.count(
                sqlfunc.nullif(UserProgress.completed, False)
            ).label("lessons_completed"),
        )
        .outerjoin(UserProgress, UserProgress.user_id == User.id)
        .group_by(User.id, User.username, User.avatar_url)
        .order_by(sqlfunc.coalesce(sqlfunc.sum(UserProgress.xp_earned), 0).desc())
        .limit(limit)
        .all()
    )
    return [
        LeaderboardEntry(
            rank=i + 1,
            user_id=row.id,
            username=row.username,
            avatar_url=row.avatar_url,
            total_xp=int(row.total_xp),
            lessons_completed=int(row.lessons_completed),
            is_current_user=(row.id == current_user.id),
        )
        for i, row in enumerate(rows)
    ]


@router.get("/review/exercises")
def get_review_exercises(
    count: int = Query(default=10, ge=1, le=30),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    completed_lesson_ids = [
        row[0]
        for row in db.query(UserProgress.lesson_id)
        .filter(UserProgress.user_id == current_user.id, UserProgress.completed.is_(True))
        .all()
    ]
    if not completed_lesson_ids:
        return {"exercises": [], "total": 0}

    exercises = (
        db.query(Exercise)
        .filter(Exercise.lesson_id.in_(completed_lesson_ids))
        .order_by(sqlfunc.random())
        .limit(count)
        .all()
    )
    return {
        "exercises": [ExerciseResponse.model_validate(e) for e in exercises],
        "total": len(exercises),
    }

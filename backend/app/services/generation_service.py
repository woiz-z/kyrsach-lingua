import json
import logging
import random
import re
import time
from openai import OpenAI
from app.config import settings, FREE_MODEL_POOL

VALID_EXERCISE_TYPES = {
    "multiple_choice", "fill_blank", "translate", "match",
    "true_false", "open_answer", "reorder_words",
}

# Lazy Gemini client — created once on first use if GOOGLE_AI_STUDIO_KEY is set.
_gemini_client: OpenAI | None = None
_openrouter_client: OpenAI | None = None

def _get_gemini_client() -> OpenAI | None:
    global _gemini_client
    if not settings.GOOGLE_AI_STUDIO_KEY:
        return None
    if _gemini_client is None:
        _gemini_client = OpenAI(
            base_url=settings.GOOGLE_AI_STUDIO_BASE_URL,
            api_key=settings.GOOGLE_AI_STUDIO_KEY,
        )
    return _gemini_client


def _get_openrouter_client() -> OpenAI | None:
    global _openrouter_client
    if not settings.OPENROUTER_API_KEY:
        return None
    if _openrouter_client is None:
        _openrouter_client = OpenAI(
            base_url=settings.OPENROUTER_BASE_URL,
            api_key=settings.OPENROUTER_API_KEY,
        )
    return _openrouter_client


class GenerationService:
    def _gemini_model_candidates(self) -> list[str]:
        candidates = [
            settings.GOOGLE_AI_STUDIO_MODEL,
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-flash-lite-latest",
        ]
        unique: list[str] = []
        for model in candidates:
            model_name = (model or "").strip()
            if model_name and model_name not in unique:
                unique.append(model_name)
        return unique

    def _repair_json_text(self, text: str) -> str:
        """Repair common LLM JSON issues (raw control chars in strings, trailing commas)."""
        repaired_chars: list[str] = []
        in_string = False
        escaped = False

        for ch in text:
            if in_string:
                if escaped:
                    repaired_chars.append(ch)
                    escaped = False
                    continue

                if ch == "\\":
                    repaired_chars.append(ch)
                    escaped = True
                    continue

                if ch == '"':
                    repaired_chars.append(ch)
                    in_string = False
                    continue

                # JSON strings cannot contain raw control chars.
                if ch == "\n":
                    repaired_chars.append("\\n")
                    continue
                if ch == "\r":
                    repaired_chars.append("\\r")
                    continue
                if ch == "\t":
                    repaired_chars.append("\\t")
                    continue
                if ord(ch) < 32:
                    repaired_chars.append(f"\\u{ord(ch):04x}")
                    continue

                repaired_chars.append(ch)
                continue

            repaired_chars.append(ch)
            if ch == '"':
                in_string = True

        repaired = "".join(repaired_chars)
        # Remove trailing commas before object/array close.
        repaired = re.sub(r",\s*([}\]])", r"\1", repaired)
        return repaired

    def _extract_json(self, text: str) -> dict:
        if not text:
            raise ValueError("Empty model response")

        # 1. Strip thinking blocks from reasoning models (Qwen3, DeepSeek-R1, etc.)
        cleaned = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL | re.IGNORECASE).strip()
        # 2. Strip markdown code fences
        cleaned = re.sub(r"```json|```", "", cleaned, flags=re.IGNORECASE).strip()

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            # Find the outermost JSON object by scanning for balanced braces
            start = cleaned.find("{")
            if start == -1:
                raise ValueError("Model did not return JSON")
            depth = 0
            end = -1
            for i in range(start, len(cleaned)):
                if cleaned[i] == "{":
                    depth += 1
                elif cleaned[i] == "}":
                    depth -= 1
                    if depth == 0:
                        end = i
                        break
            candidate = cleaned[start : end + 1] if end != -1 else cleaned[start:]
            if not candidate:
                raise ValueError("Model did not return JSON")
            try:
                return json.loads(candidate)
            except json.JSONDecodeError:
                repaired = self._repair_json_text(candidate)
                return json.loads(repaired)

    def _call_json_model(self, system_prompt: str, user_prompt: str) -> dict:
        logger = logging.getLogger("linguaai.generation")
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        # ── 1. Try Gemini (Google AI Studio) first ───────────────────
        gemini = _get_gemini_client()
        last_exc: Exception | None = None
        if gemini:
            for model in self._gemini_model_candidates():
                started_at = time.perf_counter()
                logger.info("[model_call] start gemini_model=%s prompt_chars=%s", model, len(user_prompt))
                try:
                    response = gemini.chat.completions.create(
                        model=model,
                        messages=messages,
                        temperature=0.4,
                        max_tokens=settings.AI_GENERATION_MAX_TOKENS,
                    )
                    if response.choices:
                        content = response.choices[0].message.content
                        if content:
                            elapsed = int((time.perf_counter() - started_at) * 1000)
                            logger.info("[model_call] done gemini_model=%s chars=%s elapsed_ms=%s", model, len(content), elapsed)
                            return self._extract_json(content.strip())
                    raise ValueError("Empty response from Gemini")
                except Exception as exc:
                    last_exc = exc
                    elapsed = int((time.perf_counter() - started_at) * 1000)
                    err_str = str(exc)
                    retryable = (
                        "429" in err_str
                        or "quota" in err_str.lower()
                        or "rate" in err_str.lower()
                        or "404" in err_str
                        or "not found" in err_str.lower()
                    )
                    if retryable:
                        logger.warning("[model_call] gemini_retry model=%s elapsed_ms=%s error=%s", model, elapsed, err_str[:200])
                        continue
                    logger.error("[model_call] gemini_error model=%s elapsed_ms=%s error=%s", model, elapsed, err_str[:200])
                    raise

        # ── 2. Fall back to OpenRouter pool ──────────────────────────
        openrouter = _get_openrouter_client()
        if not openrouter:
            raise last_exc or RuntimeError("Gemini models exhausted and OPENROUTER_API_KEY is not configured")

        pool = list(FREE_MODEL_POOL)
        random.shuffle(pool)

        # Two passes: if the whole pool is rate-limited, wait 10 s then retry once.
        for pass_num in range(2):
            if pass_num == 1:
                logger.warning("[model_call] all models failed on first pass, backing off 10s then retrying")
                time.sleep(10)
            for model in pool:
                started_at = time.perf_counter()
                logger.info("[model_call] start model=%s prompt_chars=%s", model, len(user_prompt))

                # For Qwen3 / DeepSeek-R1 thinking models: disable thinking so
                # (a) max_tokens aren't consumed by hidden reasoning,
                # (b) <think> blocks don't pollute the JSON output.
                extra_body: dict = {}
                if "qwen3" in model or "deepseek-r1" in model.lower():
                    extra_body = {"thinking": {"type": "disabled"}}

                try:
                    kwargs: dict = dict(
                        model=model,
                        messages=messages,
                        temperature=0.4,
                        max_tokens=settings.AI_GENERATION_MAX_TOKENS,
                    )
                    if extra_body:
                        kwargs["extra_body"] = extra_body

                    response = openrouter.chat.completions.create(**kwargs)

                    # Guard: some providers return empty choices or None content
                    if not response.choices:
                        raise ValueError("Model returned empty choices list")
                    content = response.choices[0].message.content
                    if content is None:
                        raise ValueError("Model returned None content (content filtering?)")

                    raw = content.strip()
                    elapsed = int((time.perf_counter() - started_at) * 1000)
                    logger.info(
                        "[model_call] done model=%s chars=%s elapsed_ms=%s",
                        model, len(raw), elapsed,
                    )
                    return self._extract_json(raw)
                except Exception as exc:
                    elapsed = int((time.perf_counter() - started_at) * 1000)
                    err_str = str(exc)
                    is_rate_limit = (
                        "429" in err_str
                        or "rate_limit" in err_str.lower()
                        or "rate limit" in err_str.lower()
                        or "too many requests" in err_str.lower()
                    )
                    is_unavailable = "404" in err_str or "no endpoints" in err_str.lower()
                    if is_rate_limit:
                        logger.warning("[model_call] 429 model=%s elapsed_ms=%s — trying next", model, elapsed)
                    elif is_unavailable:
                        logger.warning("[model_call] unavailable model=%s elapsed_ms=%s — trying next", model, elapsed)
                    else:
                        logger.error("[model_call] error model=%s elapsed_ms=%s error=%s", model, elapsed, err_str[:250])
                    last_exc = exc
                    continue
        raise last_exc or RuntimeError("All models in pool exhausted after 2 passes")

    def _normalize_exercise(self, item: dict) -> dict:
        exercise_type = str(item.get("exercise_type", "multiple_choice")).strip().lower()
        if exercise_type not in VALID_EXERCISE_TYPES:
            exercise_type = "multiple_choice"

        question = str(item.get("question", "")).strip()
        correct_answer = str(item.get("correct_answer", "")).strip()
        explanation = str(item.get("explanation", "")).strip()
        hint = str(item.get("hint", "")).strip()
        points = int(item.get("points", 10) or 10)
        difficulty = str(item.get("difficulty", "medium")).strip().lower()
        if difficulty not in {"easy", "medium", "hard"}:
            difficulty = "medium"

        raw_options = item.get("options")
        options = None
        if isinstance(raw_options, list):
            options = [str(opt).strip() for opt in raw_options if str(opt).strip()]
        elif isinstance(raw_options, dict) and isinstance(raw_options.get("choices"), list):
            options = [str(opt).strip() for opt in raw_options["choices"] if str(opt).strip()]

        if exercise_type == "multiple_choice" and (not options or len(options) < 2):
            options = [correct_answer, "Option B", "Option C", "Option D"]

        if exercise_type == "multiple_choice" and options:
            deduped: list[str] = []
            for opt in options:
                if opt not in deduped:
                    deduped.append(opt)
            options = deduped[:4]
            if correct_answer not in options:
                options = ([correct_answer] + options)[:4]
            while len(options) < 4:
                options.append(f"Option {chr(65 + len(options))}")

        if exercise_type == "true_false" and not options:
            options = ["True", "False"]

        return {
            "exercise_type": exercise_type,
            "question": question,
            "options": options,
            "correct_answer": correct_answer,
            "explanation": explanation,
            "hint": hint,
            "difficulty": difficulty,
            "points": max(points, 1),
        }

    def _validate_lesson(self, payload: dict, exercises_count: int) -> bool:
        if not isinstance(payload, dict):
            return False
        if not str(payload.get("title", "")).strip():
            return False
        if not str(payload.get("description", "")).strip():
            return False

        content = payload.get("content")
        if not isinstance(content, dict):
            return False

        sections = content.get("sections")
        if isinstance(sections, list) and len(sections) >= 1:
            pass  # rich format
        elif len(str(content.get("theory", "")).strip()) >= 40:
            pass  # legacy flat format
        else:
            return False

        exercises = payload.get("exercises")
        # Accept up to 1 exercise short to avoid re-generating on minor shortfall
        min_exercises = max(1, exercises_count - 1)
        if not isinstance(exercises, list) or len(exercises) < min_exercises:
            return False

        for raw in exercises[:exercises_count]:
            if not isinstance(raw, dict):
                return False
            normalized = self._normalize_exercise(raw)
            if not normalized["question"] or not normalized["correct_answer"]:
                return False
            if normalized["exercise_type"] == "multiple_choice":
                opts = normalized.get("options") or []
                if not isinstance(opts, list) or len(opts) < 4:
                    return False
                if normalized["correct_answer"] not in opts:
                    return False

        return True

    # ── COURSE PLAN ────────────────────────────────────────────────────

    def generate_course_plan(
        self,
        language_name: str,
        level: str,
        title: str,
        focus: str,
        lessons_count: int,
        course_language: str,
    ) -> dict:
        system_prompt = (
            "You are an expert language curriculum designer who creates rich, comprehensive, "
            "university-quality course plans for language learners. "
            "Every course should feel professional, well-structured, and engaging. "
            "Return valid JSON only — no markdown, no explanations outside the JSON."
        )
        user_prompt = f"""Design a comprehensive {language_name} course plan.

COURSE DETAILS:
- Title: {title}
- Target level: {level} (CEFR)
- Focus area: {focus}
- Number of lessons: exactly {lessons_count}
- Course content language (for title/description/topics/instructions): {course_language}

REQUIREMENTS:
- Each lesson should build on the previous one, creating a clear learning progression.
- Mix lesson types for variety: grammar, vocabulary, reading, listening, conversation.
- Topics should be practical, real-world oriented, and engaging.
- Include a compelling course description (2-3 sentences) explaining what students will learn and achieve.
- Lesson topics should be specific and descriptive (e.g. "Past Tense: Talking About Yesterday's Adventures" not just "Past Tense").
- Write all returned textual fields in {course_language}.

Return JSON:
{{
  "title": "compelling course title",
  "description": "rich 2-3 sentence course description highlighting learning outcomes",
  "lessons": [
    {{
      "topic": "specific, descriptive lesson topic",
      "lesson_type": "grammar|vocabulary|reading|listening|conversation"
    }}
  ]
}}""".strip()

        logger = logging.getLogger("linguaai.generation")
        valid_types = {"grammar", "vocabulary", "reading", "listening", "conversation"}

        def _parse_lessons(raw_payload: dict) -> list[dict]:
            lessons_raw = raw_payload.get("lessons") if isinstance(raw_payload.get("lessons"), list) else []
            result: list[dict] = []
            for item in lessons_raw:
                if not isinstance(item, dict):
                    continue
                topic = str(item.get("topic", "")).strip()[:200]
                lesson_type = str(item.get("lesson_type", "grammar")).strip().lower()
                if lesson_type not in valid_types:
                    lesson_type = "grammar"
                if topic:
                    result.append({"topic": topic, "lesson_type": lesson_type})
            return result

        payload = None
        normalized_lessons: list[dict] = []
        for _plan_attempt in range(2):
            payload = self._call_json_model(system_prompt, user_prompt)
            normalized_lessons = _parse_lessons(payload)
            if len(normalized_lessons) >= max(1, lessons_count - 1):
                break
            logger.warning(
                "[course_plan] too_few_lessons attempt=%s got=%s need=%s",
                _plan_attempt + 1, len(normalized_lessons), lessons_count,
            )

        if len(normalized_lessons) < max(1, lessons_count - 1):
            raise ValueError("Model returned too few lesson plan items")

        return {
            "title": str(payload.get("title", title)).strip()[:200] or title,
            "description": str(payload.get("description", focus)).strip()[:2000] or focus,
            "lessons": normalized_lessons[:lessons_count],
        }

    # ── LESSON DRAFT ───────────────────────────────────────────────────

    def generate_lesson_draft(
        self,
        language_name: str,
        level: str,
        topic: str,
        lesson_type: str,
        exercises_count: int,
        course_language: str = "Ukrainian",
    ) -> dict:
        instruction_language = (course_language or "Ukrainian").strip()
        system_prompt = (
            "You are an expert language teacher creating rich, immersive, university-quality lesson content. "
            "Your lessons should feel like they come from a premium language-learning platform — "
            "detailed theory with clear explanations, practical examples, cultural notes, tips, "
            "and a diverse mix of exercise types to reinforce learning. "
            "Return valid JSON only — no markdown outside JSON, no extra text."
        )
        user_prompt = f"""Create a {language_name} lesson.

DETAILS:
- Topic: {topic}
- CEFR Level: {level}
- Lesson type: {lesson_type}
- Exercises: exactly {exercises_count}
- Language for all text (titles, theory, hints, explanations): {instruction_language}
- Target language for examples and answers: {language_name}

CONTENT (keep concise to fit the response budget):
- 2-3 sections with type, title, and markdown content (100-200 words each).
- Section types: intro, theory, rule, tip, dialogue, cultural_note, practice.
- Use 1-2 emojis per section (🎯💡🗣️📝🌍).
- 4-6 vocabulary entries: {{"word": "translation"}}.
- 2-3 example sentences.

EXERCISES:
- Mix types: multiple_choice, fill_blank, translate, true_false, open_answer, reorder_words.
- Use at least 2 different types across {exercises_count} exercises.
- multiple_choice MUST have exactly 4 options with the correct answer included.
- Points: easy=5, medium=10, hard=15.
- Include a short explanation (1-2 sentences) for each exercise.

Return ONLY valid JSON (no markdown fences, no extra text):
{{
  "title": "lesson title with 1 emoji",
  "description": "1-2 sentence description",
  "lesson_type": "{lesson_type}",
  "xp_reward": 25,
  "content": {{
    "sections": [
      {{"type": "intro", "title": "heading", "content": "markdown text"}}
    ],
    "examples": ["example — translation"],
    "vocabulary": {{"word": "translation"}}
  }},
  "exercises": [
    {{
      "exercise_type": "multiple_choice",
      "question": "question",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "A",
      "explanation": "short explanation",
      "hint": "",
      "difficulty": "medium",
      "points": 10
    }}
  ]
}}""".strip()

        payload = None
        max_retries = max(settings.AI_GENERATION_MAX_RETRIES, 1)
        logger = logging.getLogger("linguaai.generation")
        for attempt in range(1, max_retries + 1):
            logger.info("[lesson_draft] validate_attempt=%s/%s topic=%s", attempt, max_retries, topic)
            candidate = self._call_json_model(system_prompt, user_prompt)
            if self._validate_lesson(candidate, exercises_count):
                payload = candidate
                logger.info("[lesson_draft] validation_success attempt=%s/%s topic=%s", attempt, max_retries, topic)
                break
            logger.warning("[lesson_draft] validation_failed attempt=%s/%s topic=%s", attempt, max_retries, topic)
        if payload is None:
            raise ValueError("Model failed strict lesson validation after retries")

        title = str(payload.get("title", "AI Lesson")).strip()[:200] or "AI Lesson"
        description = str(payload.get("description", "Generated by AI")).strip()[:2000]
        valid_types = {"grammar", "vocabulary", "reading", "listening", "conversation"}
        normalized_lesson_type = str(payload.get("lesson_type", lesson_type)).strip().lower()
        if normalized_lesson_type not in valid_types:
            normalized_lesson_type = lesson_type
        xp_reward = int(payload.get("xp_reward", 25) or 25)

        content = payload.get("content") if isinstance(payload.get("content"), dict) else {}

        # Normalize sections
        raw_sections = content.get("sections")
        sections: list[dict] = []
        if isinstance(raw_sections, list):
            for s in raw_sections:
                if isinstance(s, dict) and str(s.get("content", "")).strip():
                    sections.append({
                        "type": str(s.get("type", "theory")).strip().lower(),
                        "title": str(s.get("title", "")).strip(),
                        "content": str(s.get("content", "")).strip(),
                    })

        # Fallback: if no sections but has flat "theory", convert it
        if not sections and str(content.get("theory", "")).strip():
            sections = [
                {"type": "theory", "title": "Theory", "content": str(content["theory"]).strip()}
            ]

        theory = str(content.get("theory", "")).strip()
        if not theory and sections:
            theory = "\n\n".join(s["content"] for s in sections)

        examples = content.get("examples") if isinstance(content.get("examples"), list) else []
        examples = [str(ex).strip() for ex in examples if str(ex).strip()]
        vocabulary = content.get("vocabulary") if isinstance(content.get("vocabulary"), dict) else {}
        vocabulary = {
            str(k).strip(): str(v).strip()
            for k, v in vocabulary.items()
            if str(k).strip() and str(v).strip()
        }

        raw_exercises = payload.get("exercises") if isinstance(payload.get("exercises"), list) else []
        normalized_exercises = [self._normalize_exercise(item) for item in raw_exercises if isinstance(item, dict)]
        normalized_exercises = [
            ex for ex in normalized_exercises if ex["question"] and ex["correct_answer"]
        ]

        if len(normalized_exercises) < max(1, exercises_count - 1):
            raise ValueError("Model returned too few valid exercises")

        return {
            "title": title,
            "description": description,
            "lesson_type": normalized_lesson_type,
            "xp_reward": max(xp_reward, 1),
            "content": {
                "sections": sections,
                "theory": theory,
                "examples": examples,
                "vocabulary": vocabulary,
            },
            "exercises": normalized_exercises[:exercises_count],
        }

    # ── ON-DEMAND EXERCISES ────────────────────────────────────────────

    def generate_on_demand_exercises(
        self,
        language_name: str,
        level: str,
        lesson_title: str,
        lesson_content: dict | None,
        topic_hint: str | None,
        exercises_count: int,
    ) -> list[dict]:
        system_prompt = (
            "You are an expert language teacher creating high-quality, diverse exercises. "
            "Each exercise should test a different aspect of the topic and use varied question types. "
            "Return valid JSON only — no markdown outside JSON."
        )

        context_str = ""
        if lesson_content:
            theory = lesson_content.get("theory", "")
            vocab = lesson_content.get("vocabulary", {})
            if theory:
                context_str += f"\nLesson theory: {str(theory)[:1500]}"
            if vocab:
                context_str += f"\nVocabulary: {json.dumps(vocab, ensure_ascii=False)[:500]}"

        user_prompt = f"""Generate {exercises_count} additional high-quality exercises for:
- Lesson: '{lesson_title}'
- Language: {language_name} ({level})
- Topic hint: {topic_hint or 'based on lesson content'}
{context_str}

REQUIREMENTS:
- Use a DIVERSE MIX of types: multiple_choice, fill_blank, translate, true_false, open_answer, reorder_words.
- Include at least 3 different exercise types.
- Provide detailed explanations for each answer.
- Include hints for medium/hard questions.
- Points: easy=5, medium=10, hard=15.
- Make wrong options realistic — common learner mistakes.

Return JSON:
{{
  "exercises": [
    {{
      "exercise_type": "multiple_choice|fill_blank|translate|true_false|open_answer|reorder_words",
      "question": "clear question text",
      "options": ["A", "B", "C", "D"] or null,
      "correct_answer": "correct answer",
      "explanation": "detailed explanation",
      "hint": "optional hint",
      "difficulty": "easy|medium|hard",
      "points": 10
    }}
  ]
}}""".strip()

        payload = self._call_json_model(system_prompt, user_prompt)
        raw_exercises = payload.get("exercises") if isinstance(payload.get("exercises"), list) else []
        normalized = [self._normalize_exercise(item) for item in raw_exercises if isinstance(item, dict)]
        normalized = [ex for ex in normalized if ex["question"] and ex["correct_answer"]]

        if len(normalized) < exercises_count:
            raise ValueError("Model returned too few valid exercises")

        return normalized[:exercises_count]


generation_service = GenerationService()

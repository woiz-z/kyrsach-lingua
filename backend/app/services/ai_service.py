import json
import re
from openai import OpenAI
from app.config import settings

_SYSTEM_PROMPTS = {
    "free_chat": """You are a friendly and patient language tutor helping a student practice {language}.
Your name is LingoBot. Speak primarily in {language}, but if the student struggles, 
you can mix in explanations in Ukrainian or English.
- Correct grammar mistakes gently, showing the correct form
- Introduce new vocabulary naturally in conversation
- Adapt to the student's level
- Use encouraging tone
- If the student writes in their native language, translate it to {language} and explain
- Keep responses concise (2-4 sentences) unless explaining grammar
- Never reveal internal reasoning, hidden thoughts, or chain-of-thought""",

    "grammar": """You are a grammar expert for {language}. 
Your name is LingoBot. When the student asks about grammar:
- Explain rules clearly with examples
- Use tables/lists for conjugations or declensions
- Provide practice sentences
- Compare with Ukrainian/English grammar when helpful
- Keep explanations structured and clear
- Never reveal internal reasoning, hidden thoughts, or chain-of-thought""",

    "vocabulary": """You are a vocabulary tutor for {language}.
Your name is LingoBot. Help students learn new words:
- Provide words with translations, pronunciation hints, and example sentences
- Group words by theme when possible
- Include synonyms and antonyms
- Create mini context stories using new words
- Use spaced repetition hints
- Never reveal internal reasoning, hidden thoughts, or chain-of-thought""",

    "quiz": """You are a quiz master for {language}.
Your name is LingoBot. Create interactive exercises:
- Generate multiple choice, fill-in-the-blank, and translation exercises
- Vary difficulty based on student responses
- Explain answers after each question
- Keep score and encourage the student
- Format questions clearly with options labeled A, B, C, D
- Never reveal internal reasoning, hidden thoughts, or chain-of-thought""",
}


class AIService:
    def __init__(self):
        if settings.GOOGLE_AI_STUDIO_KEY:
            self.provider = "google"
            self.client = OpenAI(
                base_url=settings.GOOGLE_AI_STUDIO_BASE_URL,
                api_key=settings.GOOGLE_AI_STUDIO_KEY,
            )
            self.model = settings.GOOGLE_AI_STUDIO_MODEL
        elif settings.OPENROUTER_API_KEY:
            self.provider = "openrouter"
            self.client = OpenAI(
                base_url=settings.OPENROUTER_BASE_URL,
                api_key=settings.OPENROUTER_API_KEY,
            )
            self.model = settings.OPENROUTER_MODEL
        else:
            self.provider = None
            self.client = None
            self.model = None

    def get_system_prompt(self, mode: str, language_name: str) -> str:
        template = _SYSTEM_PROMPTS.get(mode, _SYSTEM_PROMPTS["free_chat"])
        return template.format(language=language_name)

    def _json_model_candidates(self) -> list[str]:
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

    def _sanitize_output(self, text: str) -> str:
        if not text:
            return ""

        cleaned = re.sub(r"<think>.*?</think>", "", text, flags=re.IGNORECASE | re.DOTALL)
        cleaned = re.sub(r"<reasoning>.*?</reasoning>", "", cleaned, flags=re.IGNORECASE | re.DOTALL)
        cleaned = re.sub(r"^\s*(thinking|reasoning)\s*:\s*.*$", "", cleaned, flags=re.IGNORECASE | re.MULTILINE)
        cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
        return cleaned.strip()

    def _repair_json_text(self, text: str) -> str:
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
        return re.sub(r",\s*([}\]])", r"\1", repaired)

    def extract_json_object(self, text: str) -> dict:
        if not text:
            raise ValueError("Empty model response")

        cleaned = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL | re.IGNORECASE).strip()
        cleaned = re.sub(r"```json|```", "", cleaned, flags=re.IGNORECASE).strip()

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
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
                return json.loads(self._repair_json_text(candidate))

    def complete_json(
        self,
        prompt: str,
        temperature: float = 0.4,
        max_tokens: int = 2000,
    ) -> dict:
        if self.client is None:
            raise RuntimeError("No AI provider configured. Set GOOGLE_AI_STUDIO_KEY or OPENROUTER_API_KEY.")
        last_exc: Exception | None = None

        for model in self._json_model_candidates():
            try:
                response = self.client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                content = response.choices[0].message.content or ""
                return self.extract_json_object(content)
            except Exception as exc:
                last_exc = exc
                error_text = str(exc).lower()
                retryable = (
                    "429" in error_text
                    or "quota" in error_text
                    or "rate limit" in error_text
                    or "resource_exhausted" in error_text
                    or "not found" in error_text
                    or "404" in error_text
                )
                if retryable:
                    continue
                raise

        raise last_exc or RuntimeError("All JSON completion models failed")

    def _stream_filter(self, buffer: str, in_think: bool) -> tuple[str, str, bool]:
        """Extract safe-to-yield text from buffer, skipping <think>...</think> blocks."""
        OPEN = "<think>"
        CLOSE = "</think>"
        output = ""
        while buffer:
            if in_think:
                idx = buffer.find(CLOSE)
                if idx == -1:
                    # No closing tag yet — keep last (len(CLOSE)-1) chars in case it arrives next
                    keep = len(CLOSE) - 1
                    buffer = buffer[-keep:] if len(buffer) >= keep else buffer
                    break
                buffer = buffer[idx + len(CLOSE):]
                in_think = False
            else:
                idx = buffer.find(OPEN)
                if idx == -1:
                    # No opening tag — safe to yield all except potential partial tag at end
                    keep = len(OPEN) - 1
                    output += buffer[:-keep] if len(buffer) >= keep else ""
                    buffer = buffer[-keep:] if len(buffer) >= keep else buffer
                    break
                output += buffer[:idx]
                buffer = buffer[idx + len(OPEN):]
                in_think = True
        return output, buffer, in_think

    def chat(
        self,
        messages: list[dict],
        mode: str,
        language_name: str,
    ) -> str:
        if self.client is None:
            raise RuntimeError("No AI provider configured. Set GOOGLE_AI_STUDIO_KEY or OPENROUTER_API_KEY.")
        system_prompt = self.get_system_prompt(mode, language_name)
        full_messages = [{"role": "system", "content": system_prompt}] + messages

        response = self.client.chat.completions.create(
            model=self.model,
            messages=full_messages,
            temperature=0.7,
            max_tokens=1024,
        )
        content = response.choices[0].message.content or ""
        return self._sanitize_output(content)

    def chat_stream(
        self,
        messages: list[dict],
        mode: str,
        language_name: str,
    ):
        if self.client is None:
            raise RuntimeError("No AI provider configured. Set GOOGLE_AI_STUDIO_KEY or OPENROUTER_API_KEY.")
        system_prompt = self.get_system_prompt(mode, language_name)
        full_messages = [{"role": "system", "content": system_prompt}] + messages

        stream = self.client.chat.completions.create(
            model=self.model,
            messages=full_messages,
            temperature=0.7,
            max_tokens=1024,
            stream=True,
        )

        buffer = ""
        in_think = False
        for chunk in stream:
            delta = chunk.choices[0].delta
            # Skip reasoning-only chunks (OpenRouter reasoning tokens come in delta.reasoning)
            if getattr(delta, 'reasoning', None) and not delta.content:
                continue
            if not delta.content:
                continue
            buffer += delta.content
            output, buffer, in_think = self._stream_filter(buffer, in_think)
            if output:
                yield output

        # Flush any remainder that wasn't inside a think block
        if buffer and not in_think:
            tail = buffer.strip()
            if tail:
                yield tail


ai_service = AIService()


import json
import logging
import os
import re
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class TourLLMProvider(ABC):
    @abstractmethod
    def generate_tour_data(self, prompt: str, mode: str) -> dict:
        """Return parsed tour JSON payload."""


class AzureOpenAIProvider(TourLLMProvider):
    DEFAULT_DEPLOYMENT = "gpt-5-nano"
    DEFAULT_API_VERSION = "2024-12-01-preview"

    def __init__(self):
        from openai import AzureOpenAI

        endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "").rstrip("/")
        api_key = os.getenv("AZURE_OPENAI_API_KEY", "")
        api_version = os.getenv("AZURE_OPENAI_API_VERSION", self.DEFAULT_API_VERSION)
        deployment = os.getenv(
            "AZURE_OPENAI_DEPLOYMENT_TOUR_GEN", self.DEFAULT_DEPLOYMENT
        )

        if not endpoint:
            raise ValueError("AZURE_OPENAI_ENDPOINT environment variable is not set")
        if not api_key:
            raise ValueError("AZURE_OPENAI_API_KEY environment variable is not set")

        self.client = AzureOpenAI(
            api_key=api_key,
            api_version=api_version,
            azure_endpoint=endpoint,
        )
        self.deployment = deployment
        self.timeout_seconds = int(os.getenv("AI_TIMEOUT_SECONDS", "60"))

    def generate_tour_data(self, prompt: str, mode: str) -> dict:
        schema = {
            "name": "tour_generation",
            "strict": True,
            "schema": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "description": {"type": "string"},
                    "difficulty": {
                        "type": "string",
                        "enum": ["EASY", "MEDIUM", "HARD"],
                    },
                    "steps": {
                        "type": "array",
                        "minItems": 1,
                        "items": {
                            "type": "object",
                            "properties": {
                                "title": {"type": "string"},
                                "description": {"type": "string"},
                                "latitude": {"type": "number"},
                                "longitude": {"type": "number"},
                                "puzzle": {
                                    "type": ["object", "null"],
                                    "properties": {
                                        "type": {
                                            "type": "string",
                                            "enum": ["TRIVIA"],
                                        },
                                        "question": {"type": "string"},
                                        "options": {
                                            "type": "array",
                                            "items": {"type": "string"},
                                        },
                                        "answer": {"type": "string"},
                                        "hint": {"type": "string"},
                                        "xp": {"type": "integer"},
                                    },
                                    "required": [
                                        "type",
                                        "question",
                                        "options",
                                        "answer",
                                        "hint",
                                        "xp",
                                    ],
                                    "additionalProperties": False,
                                },
                            },
                            "required": [
                                "title",
                                "description",
                                "latitude",
                                "longitude",
                                "puzzle",
                            ],
                            "additionalProperties": False,
                        },
                    },
                },
                "required": ["title", "description", "difficulty", "steps"],
                "additionalProperties": False,
            },
        }

        completion = self.client.chat.completions.create(
            model=self.deployment,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You generate city tours from verified places. "
                        "Return only valid JSON that matches the provided schema."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_schema", "json_schema": schema},
            timeout=self.timeout_seconds,
        )

        content = completion.choices[0].message.content
        if not content:
            raise ValueError("Azure OpenAI returned an empty response")

        data = json.loads(content)
        if mode == "STORY":
            for step in data.get("steps", []):
                step["puzzle"] = None
        return data


class GeminiProvider(TourLLMProvider):
    GEMINI_MODEL = "gemini-2.5-flash"

    def __init__(self):
        import google.generativeai as genai

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(self.GEMINI_MODEL)

    def generate_tour_data(self, prompt: str, mode: str) -> dict:
        response = self.model.generate_content(prompt, request_options={"timeout": 600})
        data = self._parse_response(response.text)
        if mode == "STORY":
            for step in data.get("steps", []):
                step["puzzle"] = None
        return data

    @staticmethod
    def _parse_response(response_text: str) -> dict:
        text = response_text.strip()

        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]

        text = text.strip()

        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        match = re.search(r"\{[\s\S]*\}", text)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass

        raise ValueError(
            "Failed to parse AI response as JSON. "
            "The model did not return valid JSON."
        )


def build_provider(provider_name: str) -> TourLLMProvider:
    normalized = (provider_name or "").strip().lower()
    if normalized == "azure_openai":
        return AzureOpenAIProvider()
    if normalized == "gemini":
        return GeminiProvider()
    raise ValueError(f"Unsupported AI provider: {provider_name}")


def parse_provider_list(raw: str) -> list[str]:
    if not raw:
        return []
    return [item.strip().lower() for item in raw.split(",") if item.strip()]


def load_provider_chain() -> list[TourLLMProvider]:
    primary = os.getenv("AI_PROVIDER", "azure_openai").strip().lower()
    fallback_names = parse_provider_list(os.getenv("AI_FALLBACK_PROVIDER", ""))

    provider_names: list[str] = [primary]
    for name in fallback_names:
        if name != primary and name not in provider_names:
            provider_names.append(name)

    providers: list[TourLLMProvider] = []
    for name in provider_names:
        try:
            providers.append(build_provider(name))
        except Exception as exc:
            logger.warning("Could not initialize AI provider '%s': %s", name, exc)

    if not providers:
        raise ValueError("No AI providers could be initialized")

    return providers

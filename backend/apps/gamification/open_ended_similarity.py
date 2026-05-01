import re
import unicodedata
from difflib import SequenceMatcher

DEFAULT_OPEN_ENDED_SIMILARITY_THRESHOLD = 0.8
_NON_WORD_RE = re.compile(r"[^\w\s]", flags=re.UNICODE)
_MULTISPACE_RE = re.compile(r"\s+")


def normalize_open_ended_text(value: str) -> str:
    text = unicodedata.normalize("NFKD", str(value or ""))
    text = "".join(char for char in text if not unicodedata.combining(char))
    text = text.casefold()
    text = _NON_WORD_RE.sub(" ", text)
    text = _MULTISPACE_RE.sub(" ", text).strip()
    return text


def open_ended_similarity_score(left: str, right: str) -> float:
    if not left or not right:
        return 0.0
    if left == right:
        return 1.0

    left_tokens = set(left.split())
    right_tokens = set(right.split())
    if left_tokens and right_tokens:
        if right_tokens <= left_tokens:
            return 1.0

    if right in left:
        return 1.0

    return SequenceMatcher(None, left, right).ratio()


def is_open_ended_answer_accepted(
    submitted_answer: str,
    correct_answer: str,
    *,
    threshold: float = DEFAULT_OPEN_ENDED_SIMILARITY_THRESHOLD,
) -> tuple[bool, float]:
    normalized_submitted = normalize_open_ended_text(submitted_answer)
    normalized_correct = normalize_open_ended_text(correct_answer)
    score = open_ended_similarity_score(normalized_submitted, normalized_correct)
    return score >= threshold, score

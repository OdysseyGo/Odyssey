import re
import unicodedata
from difflib import SequenceMatcher

DEFAULT_OPEN_ENDED_SIMILARITY_THRESHOLD = 0.8
_NON_WORD_RE = re.compile(r"[^\w\s]", flags=re.UNICODE)
_MULTISPACE_RE = re.compile(r"\s+")
_ALIAS_SPLIT_RE = re.compile(r"\s*(?:\||;|\bor\b)\s*", flags=re.IGNORECASE)
_PARENTHETICAL_RE = re.compile(r"\(([^()]*)\)")
_STOPWORDS = {
    "a",
    "an",
    "and",
    "answer",
    "at",
    "is",
    "it",
    "its",
    "of",
    "the",
    "this",
    "to",
    "was",
}


def normalize_open_ended_text(value: str) -> str:
    text = unicodedata.normalize("NFKD", str(value or ""))
    text = "".join(char for char in text if not unicodedata.combining(char))
    text = text.casefold()
    text = text.replace("&", " and ")
    text = _NON_WORD_RE.sub(" ", text)
    text = _MULTISPACE_RE.sub(" ", text).strip()
    return text


def _normalized_tokens(value: str) -> list[str]:
    return [
        _singularize_token(token)
        for token in normalize_open_ended_text(value).split()
        if token not in _STOPWORDS
    ]


def _singularize_token(token: str) -> str:
    if len(token) <= 3:
        return token
    if token.endswith("ies") and len(token) > 4:
        return token[:-3] + "y"
    if token.endswith("es") and len(token) > 4:
        return token[:-2]
    if token.endswith("s") and not token.endswith("ss"):
        return token[:-1]
    return token


def _canonical_token_text(value: str) -> str:
    return " ".join(_normalized_tokens(value))


def _answer_variants(answer: str) -> list[str]:
    raw_answer = str(answer or "")
    variants = [raw_answer]

    for parenthetical in _PARENTHETICAL_RE.findall(raw_answer):
        variants.append(parenthetical)
        variants.append(_PARENTHETICAL_RE.sub("", raw_answer))

    for part in _ALIAS_SPLIT_RE.split(raw_answer):
        if part.strip():
            variants.append(part)

    normalized_variants = []
    seen = set()
    for variant in variants:
        normalized = normalize_open_ended_text(variant)
        if normalized and normalized not in seen:
            seen.add(normalized)
            normalized_variants.append(normalized)
    return normalized_variants


def _initialism(tokens: list[str]) -> str:
    return "".join(token[0] for token in tokens if token)


def _numeric_score(submitted: str, correct: str) -> float:
    correct_numbers = set(re.findall(r"\d+", correct))
    if not correct_numbers:
        return 0.0
    submitted_numbers = set(re.findall(r"\d+", submitted))
    return 1.0 if correct_numbers <= submitted_numbers else 0.0


def _token_overlap_score(submitted_tokens: list[str], correct_tokens: list[str]) -> float:
    if not submitted_tokens or not correct_tokens:
        return 0.0

    submitted_set = set(submitted_tokens)
    correct_set = set(correct_tokens)
    overlap = len(submitted_set & correct_set)
    if overlap == 0:
        return 0.0

    precision = overlap / len(submitted_set)
    recall = overlap / len(correct_set)
    return 2 * precision * recall / (precision + recall)


def _single_variant_similarity_score(submitted: str, correct: str) -> float:
    if not submitted or not correct:
        return 0.0
    if submitted == correct:
        return 1.0

    numeric_score = _numeric_score(submitted, correct)
    if numeric_score:
        return numeric_score

    submitted_tokens = _normalized_tokens(submitted)
    correct_tokens = _normalized_tokens(correct)
    submitted_token_text = " ".join(submitted_tokens)
    correct_token_text = " ".join(correct_tokens)

    if submitted_token_text and submitted_token_text == correct_token_text:
        return 1.0

    if correct_tokens and set(correct_tokens) <= set(submitted_tokens):
        return 1.0

    if correct_token_text and f" {correct_token_text} " in f" {submitted_token_text} ":
        return 1.0

    correct_initialism = _initialism(correct_tokens)
    submitted_initialism = _initialism(submitted_tokens)
    if correct_initialism and correct_initialism in {submitted, submitted_initialism}:
        return 1.0

    token_overlap = _token_overlap_score(submitted_tokens, correct_tokens)
    token_sort_ratio = SequenceMatcher(
        None,
        " ".join(sorted(submitted_tokens)),
        " ".join(sorted(correct_tokens)),
    ).ratio()
    raw_ratio = SequenceMatcher(None, submitted, correct).ratio()
    canonical_ratio = SequenceMatcher(
        None, _canonical_token_text(submitted), _canonical_token_text(correct)
    ).ratio()

    return max(token_overlap, token_sort_ratio, raw_ratio, canonical_ratio)


def open_ended_similarity_score(left: str, right: str) -> float:
    submitted = normalize_open_ended_text(left)
    return max(
        (
            _single_variant_similarity_score(submitted, correct_variant)
            for correct_variant in _answer_variants(right)
        ),
        default=0.0,
    )


def is_open_ended_answer_accepted(
    submitted_answer: str,
    correct_answer: str,
    *,
    threshold: float = DEFAULT_OPEN_ENDED_SIMILARITY_THRESHOLD,
) -> tuple[bool, float]:
    score = open_ended_similarity_score(submitted_answer, correct_answer)
    return score >= threshold, score

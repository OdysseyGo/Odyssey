GENERIC_GENERATION_ERROR = (
    "We could not generate your tour right now. Please try again."
)


def get_generation_error_message(exc: Exception) -> str:
    """Return a client-safe message for a generation failure."""
    raw_message = str(exc)
    message = raw_message.lower()
    exc_name = exc.__class__.__name__.lower()

    if isinstance(exc, TimeoutError) or "timeout" in message or "deadline" in message:
        return "Tour generation took too long. Please try again."

    if any(
        token in message or token in exc_name
        for token in ("quota", "rate limit", "resource_exhausted", "429")
    ):
        return "Tour generation is temporarily busy. Please try again later."

    if any(
        token in message or token in exc_name
        for token in ("unavailable", "connection", "network", "503", "502")
    ):
        return "The AI service is temporarily unavailable. Please try again later."

    if any(
        token in message
        for token in ("gemini_api_key", "api key", "permission", "unauthorized")
    ):
        return "AI tour generation is not configured correctly. Please try again later."

    if isinstance(exc, ValueError):
        if "could not find any real places" in message:
            return (
                "We could not find enough real places for that city and theme. "
                "Try a different city, theme, or more general details."
            )

        if any(
            token in message
            for token in (
                "ai response",
                "valid json",
                "missing required",
                "steps",
            )
        ):
            return "The AI response could not be turned into a valid tour. Please try again."

    return GENERIC_GENERATION_ERROR

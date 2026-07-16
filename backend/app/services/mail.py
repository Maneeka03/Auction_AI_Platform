import logging
from collections import deque
from datetime import UTC, datetime

from app.core.config import settings

logger = logging.getLogger("provenix.mail")

_outbox: deque[dict[str, str]] = deque(maxlen=50)


async def send(to: str, subject: str, body: str) -> None:
    """Delivery adapter. Replace this body with the transactional provider (SES, Postmark, SMTP)."""
    logger.info("email to=%s subject=%r body=%s", to, subject, body)
    if not settings.is_production:
        _outbox.appendleft(
            {"to": to, "subject": subject, "body": body, "sent_at": datetime.now(UTC).isoformat()}
        )


def outbox() -> list[dict[str, str]]:
    return list(_outbox)


def clear_outbox() -> None:
    _outbox.clear()

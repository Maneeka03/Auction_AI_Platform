import asyncio
import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger(__name__)


def _send_sync(to_email: str, to_name: str, subject: str, body: str) -> None:
    msg = EmailMessage()
    msg["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
    msg["To"] = f"{to_name} <{to_email}>"
    msg["Subject"] = subject
    msg.set_content(body)

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as smtp:
        smtp.ehlo()
        smtp.starttls()
        if settings.smtp_username:
            smtp.login(settings.smtp_username, settings.smtp_password)
        smtp.send_message(msg)


async def send_email(to_email: str, to_name: str, subject: str, body: str) -> None:
    if not settings.smtp_host:
        logger.info("SMTP not configured — skipping email to %s", to_email)
        return
    try:
        await asyncio.to_thread(_send_sync, to_email, to_name, subject, body)
    except Exception:
        logger.exception("Failed to send email to %s", to_email)

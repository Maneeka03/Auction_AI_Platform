from fastapi import APIRouter, status

from app.services import mail

router = APIRouter(prefix="/dev", tags=["dev"])


@router.get("/emails")
async def list_emails() -> list[dict[str, str]]:
    """Emails the API would have sent, newest first. Pull verification and reset links from here."""
    return mail.outbox()


@router.delete("/emails", status_code=status.HTTP_204_NO_CONTENT)
async def clear_emails() -> None:
    mail.clear_outbox()

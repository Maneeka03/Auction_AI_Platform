from fastapi import APIRouter, Depends

from app.api.deps import DbSession, requires
from app.models.user import User
from app.rbac.permissions import Access, Module
from app.schemas.report import DashboardOut
from app.services import reports

router = APIRouter(prefix="/reports", tags=["reports"])

Viewer = Depends(requires(Module.REPORTS, Access.VIEW))


@router.get("/dashboard", response_model=DashboardOut)
async def dashboard(session: DbSession, _: User = Viewer) -> DashboardOut:
    return await reports.dashboard(session)

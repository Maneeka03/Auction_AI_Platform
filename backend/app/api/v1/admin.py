# from fastapi import APIRouter, Depends
# from app.models.bank_account import SellerBankAccount
# from app.schemas.bank_account import BankAccountOut
# from app.api.deps import DbSession, requires
# from app.models.user import User
# from app.rbac.permissions import Access, Module, Role
# from app.schemas.portal import DocumentVerificationOut
# from app.services import portal
# from fastapi import APIRouter, status
# from sqlalchemy import select

# from backend.app.core.errors import AppError

# from backend.app.core.errors import AppError

# router = APIRouter(prefix="/admin", tags=["admin"])

# Reviewer = Depends(requires(Module.USER_MANAGEMENT, Access.FULL))


# @router.get("/document-verification", response_model=DocumentVerificationOut)
# async def document_verification(session: DbSession, _: User = Reviewer) -> DocumentVerificationOut:
#     """Combined KYC and escrow verification status across all deals."""
#     return await portal.document_verification(session)


# @router.get("/seller-bank-accounts", response_model=list[BankAccountOut])
# async def list_bank_accounts(
#     session: DbSession,
#     actor: CurrentUser,
# ) -> list[BankAccountOut]:
#     requires(actor, Role.SUPER_ADMIN)

#     rows = await session.scalars(select(SellerBankAccount))
#     return [BankAccountOut.of(item) for item in rows]


# @router.patch("/seller-bank-accounts/{account_id}/verify", response_model=BankAccountOut)
# async def verify_bank_account(
#     account_id: uuid.UUID,
#     session: DbSession,
#     actor: CurrentUser,
# ) -> BankAccountOut:
#     requires(actor, Role.SUPER_ADMIN)

#     account = await session.get(SellerBankAccount, account_id)
#     if not account:
#         raise AppError(
#             status.HTTP_404_NOT_FOUND,
#             "not_found",
#             "Bank account not found.",
#         )

#     account.is_verified = True
#     await session.commit()
#     await session.refresh(account)

#     return BankAccountOut.of(account)






# from fastapi import APIRouter, Depends
# from app.models.bank_account import SellerBankAccount
# from app.schemas.bank_account import BankAccountOut
# from app.api.deps import DbSession, requires
# from app.models.user import User
# from app.rbac.permissions import Access, Module, Role
# from app.schemas.portal import DocumentVerificationOut
# from app.services import portal
# from fastapi import APIRouter, status
# from sqlalchemy import select

# from backend.app.core.errors import AppError

# from backend.app.core.errors import AppError

# router = APIRouter(prefix="/admin", tags=["admin"])

# Reviewer = Depends(requires(Module.USER_MANAGEMENT, Access.FULL))


# @router.get("/document-verification", response_model=DocumentVerificationOut)
# async def document_verification(session: DbSession, _: User = Reviewer) -> DocumentVerificationOut:
#     """Combined KYC and escrow verification status across all deals."""
#     return await portal.document_verification(session)


# @router.get("/seller-bank-accounts", response_model=list[BankAccountOut])
# async def list_bank_accounts(
#     session: DbSession,
#     actor: CurrentUser,
# ) -> list[BankAccountOut]:
#     requires(actor, Role.SUPER_ADMIN)

#     rows = await session.scalars(select(SellerBankAccount))
#     return [BankAccountOut.of(item) for item in rows]


# @router.patch("/seller-bank-accounts/{account_id}/verify", response_model=BankAccountOut)
# async def verify_bank_account(
#     account_id: uuid.UUID,
#     session: DbSession,
#     actor: CurrentUser,
# ) -> BankAccountOut:
#     requires(actor, Role.SUPER_ADMIN)

#     account = await session.get(SellerBankAccount, account_id)
#     if not account:
#         raise AppError(
#             status.HTTP_404_NOT_FOUND,
#             "not_found",
#             "Bank account not found.",
#         )

#     account.is_verified = True
#     await session.commit()
#     await session.refresh(account)

#     return BankAccountOut.of(account)

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select

from app.api.deps import CurrentUser, DbSession, requires
from app.core.errors import AppError
from app.models.bank_account import SellerBankAccount
from app.models.user import User
from app.rbac.permissions import Access, Module, Role
from app.schemas.bank_account import (
    BankAccountPage,
    BankAccountReviewOut,
    ReviewBankAccountRequest,
)
from app.schemas.portal import DocumentVerificationOut
from app.services import portal


router = APIRouter(prefix="/admin", tags=["admin"])


Reviewer = Depends(requires(Module.USER_MANAGEMENT, Access.FULL))


@router.get("/document-verification", response_model=DocumentVerificationOut)
async def document_verification(
    session: DbSession,
    _: User = Reviewer,
) -> DocumentVerificationOut:
    """Combined KYC and escrow verification status across all deals."""
    return await portal.document_verification(session)


# @router.get("/seller-bank-accounts", response_model=list[BankAccountOut])
# async def list_bank_accounts(
#     session: DbSession,
#     actor: CurrentUser,
# ) -> list[BankAccountOut]:
#     if Role.SUPER_ADMIN not in actor.roles:
#         raise AppError(
#             status.HTTP_403_FORBIDDEN,
#             "forbidden",
#             "Only super admins can access bank accounts.",
#         )

#     rows = await session.scalars(select(SellerBankAccount))
#     return [BankAccountOut.of(item) for item in rows]

@router.get("/seller-bank-accounts", response_model=BankAccountPage)
async def list_bank_accounts(
    session: DbSession,
    actor: CurrentUser,
    page: int = Query(1, ge=1),
    size: int = Query(25, ge=1, le=100),
    verified: bool | None = Query(None),
) -> BankAccountPage:
    if Role.SUPER_ADMIN not in actor.roles:
        raise AppError(
            status.HTTP_403_FORBIDDEN,
            "forbidden",
            "Only super admins can access bank accounts.",
        )

    query = select(SellerBankAccount)
    if verified is not None:
        query = query.where(SellerBankAccount.is_verified == verified)

    total = await session.scalar(select(func.count()).select_from(query.subquery()))
    rows = await session.scalars(
        query.order_by(SellerBankAccount.updated_at.desc())
        .offset((page - 1) * size)
        .limit(size)
    )

    return BankAccountPage(
        items=[BankAccountReviewOut.of(item) for item in rows],
        total=total or 0,
        page=page,
        size=size,
    )


@router.patch(
    "/seller-bank-accounts/{account_id}",
    response_model=BankAccountReviewOut,
)
async def review_bank_account(
    account_id: uuid.UUID,
    payload: ReviewBankAccountRequest,
    session: DbSession,
    actor: CurrentUser,
) -> BankAccountReviewOut:
    """Approve or reject a seller's payout bank details. Rejecting just clears the verified flag
    so the seller can resubmit - it doesn't delete their details."""
    if Role.SUPER_ADMIN not in actor.roles:
        raise AppError(
            status.HTTP_403_FORBIDDEN,
            "forbidden",
            "Only super admins can verify bank accounts.",
        )

    account = await session.get(SellerBankAccount, account_id)
    if not account:
        raise AppError(
            status.HTTP_404_NOT_FOUND,
            "not_found",
            "Bank account not found.",
        )

    account.is_verified = payload.approved
    await session.commit()
    await session.refresh(account)

    return BankAccountReviewOut.of(account)

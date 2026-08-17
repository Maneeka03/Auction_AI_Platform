# import uuid

# from fastapi import APIRouter, Query, status

# from app.api.deps import CurrentUser, DbSession, requires
# from app.core.errors import AppError
# from app.models.category_request import CategoryRequestStatus
# from app.models.user import User
# from app.rbac.permissions import Access, Module, Role
# from app.schemas.category_request import (
#     CategoryRequestOut,
#     CreateCategoryRequestPayload,
#     ReviewCategoryRequestPayload,
# )
# from app.services import category_requests


# router = APIRouter(tags=["category-requests"])

# AdminReviewer = requires(Module.ASSET_MANAGEMENT, Access.FULL)


# @router.post(
#     "/seller/category-requests",
#     response_model=CategoryRequestOut,
#     status_code=status.HTTP_201_CREATED,
# )
# async def submit_category_request(
#     payload: CreateCategoryRequestPayload,
#     session: DbSession,
#     actor: CurrentUser,
# ) -> CategoryRequestOut:
#     if Role.SELLER not in actor.roles:
#         raise AppError(
#             status.HTTP_403_FORBIDDEN,
#             "forbidden",
#             "Only sellers can submit category requests.",
#         )

#     req = await category_requests.create(session, actor, payload)
#     return CategoryRequestOut.of(req)


# @router.get(
#     "/seller/category-requests",
#     response_model=list[CategoryRequestOut],
# )
# async def list_my_category_requests(
#     session: DbSession,
#     actor: CurrentUser,
# ) -> list[CategoryRequestOut]:
#     if Role.SELLER not in actor.roles:
#         raise AppError(
#             status.HTTP_403_FORBIDDEN,
#             "forbidden",
#             "Only sellers can access this.",
#         )

#     reqs = await category_requests.list_for_seller(session, actor.id)
#     return [CategoryRequestOut.of(r) for r in reqs]


# @router.get(
#     "/admin/category-requests",
#     response_model=list[CategoryRequestOut],
# )
# async def list_all_category_requests(
#     session: DbSession,
#     _actor: User = AdminReviewer,
#     filter_status: CategoryRequestStatus | None = Query(default=None),
# ) -> list[CategoryRequestOut]:
#     reqs = await category_requests.list_all(session, filter_status)
#     return [CategoryRequestOut.of(r) for r in reqs]


# @router.patch(
#     "/admin/category-requests/{request_id}",
#     response_model=CategoryRequestOut,
# )
# async def review_category_request(
#     request_id: uuid.UUID,
#     payload: ReviewCategoryRequestPayload,
#     session: DbSession,
#     actor: User = AdminReviewer,
# ) -> CategoryRequestOut:
#     req = await category_requests.review(
#         session,
#         request_id,
#         actor,
#         payload,
#     )
#     return CategoryRequestOut.of(req)











import uuid

from fastapi import APIRouter, Depends, Query

from app.api.deps import DbSession, requires
from app.models.user import User
from app.rbac.permissions import Access, Module
from app.schemas.bank_account import BankAccountPage, BankAccountReviewOut, ReviewBankAccountRequest
from app.services import bank_accounts

router = APIRouter(prefix="/admin/bank-details", tags=["admin-bank-details"])

Reviewer = Depends(requires(Module.USER_MANAGEMENT, Access.FULL))


@router.get("", response_model=BankAccountPage)
async def list_bank_details(
    session: DbSession,
    page: int = Query(1, ge=1),
    size: int = Query(25, ge=1, le=100),
    verified: bool | None = Query(None),
    _: User = Reviewer,
) -> BankAccountPage:
    items, total = await bank_accounts.paginate(session, page, size, verified)
    return BankAccountPage(
        items=[BankAccountReviewOut.of(item) for item in items], total=total, page=page, size=size
    )


@router.patch("/{account_id}", response_model=BankAccountReviewOut)
async def review_bank_details(
    account_id: uuid.UUID,
    payload: ReviewBankAccountRequest,
    session: DbSession,
    _: User = Reviewer,
) -> BankAccountReviewOut:
    account = await bank_accounts.review(session, account_id, payload.approved)
    return BankAccountReviewOut.of(account)

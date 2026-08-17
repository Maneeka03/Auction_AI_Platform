# # import uuid

# # from sqlalchemy import select
# # from sqlalchemy.ext.asyncio import AsyncSession

# # from app.models.bank_account import BankAccountType, SellerBankAccount


# # async def mine(session: AsyncSession, user_id: uuid.UUID) -> SellerBankAccount | None:
# #     return await session.scalar(
# #         select(SellerBankAccount).where(SellerBankAccount.user_id == user_id)
# #     )


# # async def upsert(
# #     session: AsyncSession,
# #     user_id: uuid.UUID,
# #     account_holder_name: str,
# #     bank_name: str,
# #     account_number: str,
# #     ifsc_code: str,
# #     branch_name: str | None,
# #     account_type: BankAccountType,
# # ) -> SellerBankAccount:
# #     """Create or replace the seller's payout details.

# #     A single row per seller - changing the numbers always clears any prior staff verification,
# #     since a verification only ever vouches for the exact details it was granted against.
# #     """
# #     existing = await session.scalar(
# #         select(SellerBankAccount)
# #         .where(SellerBankAccount.user_id == user_id)
# #         .with_for_update()
# #     )
# #     if existing is None:
# #         existing = SellerBankAccount(user_id=user_id)
# #         session.add(existing)

# #     existing.account_holder_name = account_holder_name
# #     existing.bank_name = bank_name
# #     existing.account_number = account_number
# #     existing.ifsc_code = ifsc_code
# #     existing.branch_name = branch_name
# #     existing.account_type = account_type
# #     existing.is_verified = False

# #     await session.commit()
# #     await session.refresh(existing)
# #     return existing

# import uuid

# from sqlalchemy import func, select
# from sqlalchemy.ext.asyncio import AsyncSession

# from app.models.bank_account import BankAccountType, SellerBankAccount


# async def mine(
#     session: AsyncSession,
#     user_id: uuid.UUID,
# ) -> SellerBankAccount | None:
#     return await session.scalar(
#         select(SellerBankAccount).where(SellerBankAccount.user_id == user_id)
#     )


# async def upsert(
#     session: AsyncSession,
#     user_id: uuid.UUID,
#     account_holder_name: str,
#     bank_name: str,
#     account_number: str,
#     ifsc_code: str,
#     branch_name: str | None,
#     account_type: BankAccountType,
# ) -> SellerBankAccount:
#     """
#     Create or update the seller's payout bank account.

#     Any change to bank details resets verification because approval is tied
#     to the exact account details that were previously verified.
#     """

#     existing = await session.scalar(
#         select(SellerBankAccount)
#         .where(SellerBankAccount.user_id == user_id)
#         .with_for_update()
#     )

#     if existing is None:
#         existing = SellerBankAccount(user_id=user_id)
#         session.add(existing)

#     existing.account_holder_name = account_holder_name
#     existing.bank_name = bank_name
#     existing.account_number = account_number
#     existing.ifsc_code = ifsc_code
#     existing.branch_name = branch_name
#     existing.account_type = account_type

#     # Reset verification whenever details change
#     existing.is_verified = False

#     await session.commit()
#     await session.refresh(existing)

#     return existing


# async def paginate(
#     session: AsyncSession,
#     page: int,
#     size: int,
#     verified: bool | None = None,
# ):
#     query = select(SellerBankAccount)

#     if verified is not None:
#         query = query.where(SellerBankAccount.is_verified == verified)

#     total_query = select(func.count()).select_from(SellerBankAccount)

#     if verified is not None:
#         total_query = total_query.where(SellerBankAccount.is_verified == verified)

#     total = await session.scalar(total_query)

#     result = await session.scalars(
#         query
#         .order_by(SellerBankAccount.updated_at.desc())
#         .offset((page - 1) * size)
#         .limit(size)
#     )

#     items = result.all()

#     return items, total or 0


# async def review(
#     session: AsyncSession,
#     account_id: uuid.UUID,
#     approved: bool,
# ) -> SellerBankAccount:
#     account = await session.get(SellerBankAccount, account_id)

#     if account is None:
#         raise ValueError("Bank account not found")

#     account.is_verified = approved

#     await session.commit()
#     await session.refresh(account)

#     return account
import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.bank_account import BankAccountType, SellerBankAccount


async def mine(
    session: AsyncSession,
    user_id: uuid.UUID,
) -> SellerBankAccount | None:
    return await session.scalar(
        select(SellerBankAccount).where(
            SellerBankAccount.user_id == user_id
        )
    )


async def upsert(
    session: AsyncSession,
    user_id: uuid.UUID,
    account_holder_name: str,
    bank_name: str,
    account_number: str,
    ifsc_code: str,
    branch_name: str | None,
    account_type: BankAccountType,
) -> SellerBankAccount:
    """
    Create or replace the seller's payout details.

    A single row exists per seller. Whenever the seller changes
    their bank details, the previous verification is cleared.
    """

    existing = await session.scalar(
        select(SellerBankAccount)
        .where(SellerBankAccount.user_id == user_id)
        .with_for_update()
    )

    if existing is None:
        existing = SellerBankAccount(user_id=user_id)
        session.add(existing)

    existing.account_holder_name = account_holder_name
    existing.bank_name = bank_name
    existing.account_number = account_number
    existing.ifsc_code = ifsc_code
    existing.branch_name = branch_name
    existing.account_type = account_type

    # Any change to bank details requires fresh verification.
    existing.is_verified = False

    await session.commit()
    await session.refresh(existing)

    return existing


async def paginate(
    session: AsyncSession,
    page: int,
    size: int,
    verified: bool | None = None,
) -> tuple[list[SellerBankAccount], int]:
    """
    Return seller bank accounts for Super Admin review.
    """

    query = select(SellerBankAccount)

    count_query = select(
        func.count(SellerBankAccount.id)
    )

    if verified is not None:
        query = query.where(
            SellerBankAccount.is_verified == verified
        )
        count_query = count_query.where(
            SellerBankAccount.is_verified == verified
        )

    query = (
        query
        .order_by(SellerBankAccount.updated_at.desc())
        .offset((page - 1) * size)
        .limit(size)
    )

    result = await session.scalars(query)
    items = list(result.all())

    total = await session.scalar(count_query)

    return items, total or 0


async def review(
    session: AsyncSession,
    account_id: uuid.UUID,
    approved: bool,
) -> SellerBankAccount:
    """
    Approve or unapprove a seller payout bank account.
    """

    account = await session.scalar(
        select(SellerBankAccount)
        .where(SellerBankAccount.id == account_id)
        .with_for_update()
    )

    if account is None:
        raise ValueError("Seller bank account not found.")

    account.is_verified = approved

    await session.commit()
    await session.refresh(account)

    return account
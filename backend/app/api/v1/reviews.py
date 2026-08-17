import uuid

from fastapi import APIRouter, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.review import CreateReviewRequest, ReviewOut
from app.services import reviews

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
async def create_review(
    payload: CreateReviewRequest, session: DbSession, actor: CurrentUser
) -> ReviewOut:
    return ReviewOut.of(await reviews.create(session, actor, payload))


@router.get("/seller/{seller_id}", response_model=list[ReviewOut])
async def seller_reviews(
    seller_id: uuid.UUID, session: DbSession, _: CurrentUser
) -> list[ReviewOut]:
    return [ReviewOut.of(item) for item in await reviews.for_seller(session, seller_id)]


@router.get("/property/{property_id}", response_model=list[ReviewOut])
async def property_reviews(
    property_id: uuid.UUID, session: DbSession, _: CurrentUser
) -> list[ReviewOut]:
    return [ReviewOut.of(item) for item in await reviews.for_property(session, property_id)]

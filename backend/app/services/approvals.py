import uuid

from fastapi import status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.notification import NotificationKind
from app.models.property import QUORUM, Property, PropertyStatus, PropertyVote, seat_of
from app.models.user import User
from app.services import notifications, properties


def outcome(listing: Property) -> PropertyStatus:
    """A listing goes live, or dies, on the second matching vote. Until then it stays a draft."""
    if sum(vote.approved for vote in listing.votes) >= QUORUM:
        return PropertyStatus.PUBLISHED
    if sum(not vote.approved for vote in listing.votes) >= QUORUM:
        return PropertyStatus.REJECTED
    return PropertyStatus.DRAFT


async def cast(
    session: AsyncSession, actor: User, property_id: uuid.UUID, approved: bool
) -> Property:
    seat = seat_of(actor.roles)
    if seat is None:
        raise AppError(
            status.HTTP_403_FORBIDDEN,
            "not_an_approver",
            "Only the director, appraiser, or legal and finance seats can sign off a listing.",
        )

    listing = await properties.get(session, property_id)
    if listing.status is not PropertyStatus.DRAFT:
        raise AppError(
            status.HTTP_409_CONFLICT,
            "already_decided",
            "This listing has already been through sign-off.",
        )

    # Assigned by object so the voter is loaded for serialising - an id alone would leave the
    # relationship to lazy-load, which async cannot do.
    existing = next((vote for vote in listing.votes if vote.seat is seat), None)
    if existing is not None:
        existing.voter, existing.approved = actor, approved
    else:
        listing.votes.append(PropertyVote(seat=seat, voter=actor, approved=approved))

    listing.status = outcome(listing)
    if listing.status is not PropertyStatus.DRAFT and listing.seller_id is not None:
        notifications.push(
            session,
            listing.seller_id,
            (
                NotificationKind.PROPERTY_APPROVED
                if listing.status is PropertyStatus.PUBLISHED
                else NotificationKind.PROPERTY_REJECTED
            ),
            f"{listing.title} was {listing.status.value} by the review panel.",
            property_id=listing.id,
        )

    await session.commit()
    return listing

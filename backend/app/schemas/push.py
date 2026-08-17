from pydantic import BaseModel, Field


class PushKeys(BaseModel):
    p256dh: str = Field(max_length=200)
    auth: str = Field(max_length=100)


# class PushSubscriptionIn(BaseModel):
#     # Exactly the shape a browser's PushSubscription.toJSON() produces.
#     endpoint: str = Field(max_length=500)
#     keys: PushKeys
class PushSubscriptionIn(BaseModel):
    # Exactly the shape a browser's PushSubscription.toJSON() produces,
    # plus the frontend origin used to create the subscription.
    endpoint: str = Field(max_length=500)
    keys: PushKeys
    origin: str | None = Field(default=None, max_length=500)


class UnsubscribeIn(BaseModel):
    endpoint: str = Field(max_length=500)


class VapidKeyOut(BaseModel):
    public_key: str

import jwt
from fastapi import APIRouter, Cookie, Request, Response, status

from app.api.deps import Credentials, CurrentUser, DbSession, TokenPayload, client_ip
from app.core import rate_limit
from app.core.config import settings
from app.core.errors import unauthorized
from app.core.security import decode_jwt
from app.schemas.auth import (
    AccessToken,
    ChangePasswordRequest,
    EmailRequest,
    LoginRequest,
    Message,
    RegisterRequest,
    ResetPasswordRequest,
    SellerEnrolmentRequest,
    Session,
    TokenRequest,
)
from app.schemas.user import UserOut
from app.services import auth

router = APIRouter(prefix="/auth", tags=["auth"])

COOKIE_PATH = "/api/v1/auth"
ACCEPTED = Message(message="If the address matches an account, an email is on its way.")


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        settings.refresh_cookie_name,
        token,
        max_age=settings.refresh_token_ttl,
        httponly=True,
        secure=settings.refresh_cookie_secure,
        samesite=settings.refresh_cookie_samesite,
        domain=settings.refresh_cookie_domain,
        path=COOKIE_PATH,
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        settings.refresh_cookie_name,
        domain=settings.refresh_cookie_domain,
        path=COOKIE_PATH,
    )


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, session: DbSession, request: Request) -> UserOut:
    await rate_limit.throttle(f"register:{client_ip(request)}", 10, 3600)
    return UserOut.model_validate(await auth.register(session, payload))


@router.post("/login", response_model=AccessToken)
async def login(
    payload: LoginRequest, session: DbSession, request: Request, response: Response
) -> AccessToken:
    await rate_limit.throttle(
        f"login:{client_ip(request)}", settings.login_ip_limit, settings.login_ip_window
    )
    user = await auth.authenticate(session, payload.email, payload.password)
    access, refresh = await auth.issue_tokens(session, user)
    _set_refresh_cookie(response, refresh)
    return AccessToken(access_token=access, expires_in=settings.access_token_ttl)


@router.post("/refresh", response_model=AccessToken)
async def refresh(
    session: DbSession,
    response: Response,
    provenix_refresh: str | None = Cookie(default=None, alias=settings.refresh_cookie_name),
) -> AccessToken:
    if not provenix_refresh:
        raise unauthorized("No active session.")
    access, rotated = await auth.rotate_tokens(session, provenix_refresh)
    _set_refresh_cookie(response, rotated)
    return AccessToken(access_token=access, expires_in=settings.access_token_ttl)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    session: DbSession,
    response: Response,
    credentials: Credentials,
    provenix_refresh: str | None = Cookie(default=None, alias=settings.refresh_cookie_name),
) -> None:
    if provenix_refresh:
        await auth.revoke_session(session, provenix_refresh)
    if credentials:
        try:
            payload = decode_jwt(credentials.credentials, auth.ACCESS)
            await rate_limit.deny_token(payload["jti"], payload["exp"])
        except jwt.PyJWTError:
            pass
    _clear_refresh_cookie(response)


@router.get("/me", response_model=Session)
async def me(user: CurrentUser) -> Session:
    return Session.of(user)


@router.post("/roles/seller", response_model=Session)
async def enroll_as_seller(
    payload: SellerEnrolmentRequest, user: CurrentUser, session: DbSession
) -> Session:
    return Session.of(await auth.enroll_seller(session, user, payload.business_type))


@router.post("/verify-email", response_model=Message)
async def verify_email(payload: TokenRequest, session: DbSession) -> Message:
    await auth.verify_email(session, payload.token)
    return Message(message="Email verified. You can now sign in.")


@router.post("/resend-verification", response_model=Message, status_code=status.HTTP_202_ACCEPTED)
async def resend_verification(
    payload: EmailRequest, session: DbSession, request: Request
) -> Message:
    await rate_limit.throttle(f"resend:{client_ip(request)}", 5, 3600)
    await auth.resend_verification(session, payload.email)
    return ACCEPTED


@router.post("/forgot-password", response_model=Message, status_code=status.HTTP_202_ACCEPTED)
async def forgot_password(payload: EmailRequest, session: DbSession, request: Request) -> Message:
    await rate_limit.throttle(f"forgot:{client_ip(request)}", 5, 3600)
    await auth.forgot_password(session, payload.email)
    return ACCEPTED


@router.post("/reset-password", response_model=Message)
async def reset_password(payload: ResetPasswordRequest, session: DbSession) -> Message:
    await auth.reset_password(session, payload.token, payload.password)
    return Message(message="Password updated. You can now sign in.")


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    payload: ChangePasswordRequest,
    user: CurrentUser,
    token: TokenPayload,
    session: DbSession,
    response: Response,
) -> None:
    await auth.change_password(session, user, payload.current_password, payload.new_password)
    await rate_limit.deny_token(token["jti"], token["exp"])
    _clear_refresh_cookie(response)

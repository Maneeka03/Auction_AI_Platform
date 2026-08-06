import asyncio
import logging
import re
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

_CF_ORIGIN_RE = re.compile(r"^https://[a-z0-9-]+\.trycloudflare\.com$")

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.errors import AppError, app_error_handler, validation_error_handler
from app.core.redis import redis
from app.db.session import SessionFactory, engine
from app.services import auctions
from app.services.uploads import configure_cors

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def _settle_expired_loop() -> None:
    """Every 60 s, auto-award expired auctions to their highest bidder."""
    while True:
        await asyncio.sleep(60)
        try:
            async with SessionFactory() as session:
                await auctions.settle_expired(session)
        except Exception:
            logger.exception("auction settler loop error")


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    configure_cors()
    settler = asyncio.create_task(_settle_expired_loop())
    yield
    settler.cancel()
    await redis.aclose()
    await engine.dispose()


app = FastAPI(
    title="Provenix API",
    version="0.1.0",
    lifespan=lifespan,
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None,
    openapi_url=None if settings.is_production else "/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    # Matches any *.trycloudflare.com URL so CORS never breaks when the tunnel URL rotates.
    allow_origin_regex=r"https://[a-z0-9-]+\.trycloudflare\.com",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all so unhandled errors always include CORS headers.

    Starlette's ServerErrorMiddleware runs outside CORSMiddleware and strips those headers on
    unhandled 500s, so we add them manually here to avoid browser CORS blocks.
    """
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    origin = request.headers.get("origin", "")
    cors_headers: dict[str, str] = {}
    if origin in settings.cors_origins or _CF_ORIGIN_RE.match(origin):
        cors_headers = {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        }
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "internal_error", "message": "An unexpected error occurred."}},
        headers=cors_headers,
    )


app.include_router(api_router)


@app.get("/health", tags=["ops"])
async def health() -> dict[str, str]:
    return {"status": "ok"}

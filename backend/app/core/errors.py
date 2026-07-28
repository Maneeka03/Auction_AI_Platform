from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

UNPROCESSABLE = 422


class AppError(Exception):
    def __init__(self, status_code: int, code: str, message: str) -> None:
        self.status_code = status_code
        self.code = code
        self.message = message


def unauthorized(message: str = "Invalid or expired credentials") -> AppError:
    return AppError(status.HTTP_401_UNAUTHORIZED, "unauthorized", message)


async def app_error_handler(_: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, AppError)
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.code, "message": exc.message}},
    )


async def validation_error_handler(_: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, RequestValidationError)
    return JSONResponse(
        status_code=UNPROCESSABLE,
        content={
            "error": {
                "code": "validation_error",
                "message": "Request payload failed validation",
                "fields": [
                    {"field": ".".join(str(p) for p in e["loc"][1:]), "reason": e["msg"]}
                    for e in exc.errors()
                ],
            }
        },
    )

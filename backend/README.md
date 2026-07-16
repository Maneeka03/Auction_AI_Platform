# Provenix API

FastAPI identity service for the Provenix auction platform. Phase 1 scope: **authentication and user management only.**

Runtime dependencies, per the Framework doc: **PostgreSQL + Redis**.

## Run it

```bash
docker compose -f ../../infra/docker/docker-compose.yml up -d   # postgres + redis
python -m venv .venv && .venv/Scripts/activate                  # source .venv/bin/activate on unix
pip install -e ".[dev]"
cp .env.example .env                                            # then set PROVENIX_JWT_SECRET
alembic upgrade head

BOOTSTRAP_EMAIL=director@provenix.io BOOTSTRAP_PASSWORD=<strong-password> python -m app.bootstrap

uvicorn app.main:app --reload
```

Interactive docs: <http://localhost:8000/docs>

**Redis is required at runtime** — it backs login rate limiting, account lockout, and the access-token denylist. The **test suite does not need it** (it uses `fakeredis`), so `pytest` runs with nothing but PostgreSQL.

## Email, until a provider is wired up

`app/services/mail.py` sends nothing yet — it is a placeholder awaiting SES/Postmark/SMTP credentials. Outside production it keeps the last 50 messages in memory and serves them at:

```
GET    /api/v1/dev/emails      # newest first — verification and reset links live here
DELETE /api/v1/dev/emails      # clear
```

That makes sign-up, password reset, and staff invites fully completable today. When a provider is chosen, replace the body of `mail.send()`; the `/dev` router is registered only when `PROVENIX_ENVIRONMENT != production`, so it disappears on its own.

## Tests

```bash
pytest                       # needs the provenix_test database; Redis is faked
ruff check . && black --check .
```

## Layout

| Path | Responsibility |
| --- | --- |
| `app/rbac/permissions.py` | Role/module access matrix — the single source of truth for authorization |
| `app/models/user.py` | `users`, `user_roles`, `refresh_tokens` |
| `app/services/auth.py` | Registration, sign-in, token rotation, password lifecycle |
| `app/services/users.py` | Super-admin user management |
| `app/api/v1/` | HTTP layer only — no business logic |
| `app/services/mail.py` | The one integration point to swap for a real email provider |

The frontend contract lives in [`../../docs/AUTH_API.md`](../../docs/AUTH_API.md).

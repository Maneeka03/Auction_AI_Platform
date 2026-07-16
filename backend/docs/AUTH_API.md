# Provenix Auth API — Frontend Contract

Everything the Next.js apps need to integrate with the identity service. Base URL: `/api/v1`.

---

## 1. How sessions work

Two tokens, deliberately different:

| Token | Lives where | Lifetime | Your job |
| --- | --- | --- | --- |
| **Access token** (JWT) | Returned in the JSON body. Keep it **in memory only** | 15 min | Send as `Authorization: Bearer <token>` on every request |
| **Refresh token** | `httpOnly` cookie `provenix_refresh`, scoped to path `/api/v1/auth` | 14 days | Never read it — you *can't*. Just call `/auth/refresh` |

**Never put the access token in `localStorage` or a non-httpOnly cookie.** Hold it in a React context / Zustand store. On a page refresh the store is empty — call `POST /auth/refresh` once on app boot to get a fresh access token from the cookie.

Every request that involves the cookie (`/auth/login`, `/auth/refresh`, `/auth/logout`) **must** send credentials:

```ts
fetch(`${API}/api/v1/auth/refresh`, { method: "POST", credentials: "include" });
```

If you skip `credentials: "include"`, the cookie is not sent and refresh returns 401.

### Recommended client flow

1. App boots → `POST /auth/refresh`. 200 means signed in, 401 means signed out.
2. Store `access_token` in memory, schedule a refresh at ~`expires_in - 60` seconds.
3. Any 401 from a business endpoint → try `/auth/refresh` once → replay the request → still 401 → send the user to sign-in.

### Token rotation and reuse detection

Every `/auth/refresh` invalidates the old refresh token and issues a new one. If a **previously used** refresh token is presented again, the server assumes it was stolen and **kills the entire session family** — the legitimate user is signed out too. That's intentional. Practical consequence: **never fire two `/auth/refresh` calls in parallel.** Guard it with a single in-flight promise.

---

## 2. Error shape

Every non-2xx response has the same body:

```json
{ "error": { "code": "email_not_verified", "message": "Confirm your email address before signing in." } }
```

Validation failures (422) add a `fields` array:

```json
{ "error": { "code": "validation_error", "message": "Request payload failed validation",
             "fields": [{ "field": "password", "reason": "String should have at least 12 characters" }] } }
```

Branch on `error.code`, never on `error.message`.

| Code | HTTP | Meaning |
| --- | --- | --- |
| `unauthorized` | 401 | Missing, expired, or revoked token |
| `forbidden` | 403 | Signed in, but the role matrix says no |
| `email_not_verified` | 403 | Correct password, but the email is unconfirmed — offer "resend" |
| `account_disabled` | 403 | Suspended or deleted |
| `account_locked` | 423 | 5 failed sign-ins — locked for 15 minutes |
| `rate_limited` | 429 | Too many requests from this IP |
| `email_taken` | 409 | Registration with an existing address |
| `invalid_password` | 400 | Wrong current password on change-password |
| `invalid_token` | 400 | Verification / reset link is bad, used, or expired |
| `self_modification` | 409 | An admin tried to suspend, delete, or re-role themselves |
| `validation_error` | 422 | Payload failed schema validation |

---

## 3. Endpoints

### Public

#### `POST /auth/register`
Buyers and sellers only. Staff accounts cannot be created here.

```json
{ "email": "ada@example.com", "password": "min-12-characters",
  "full_name": "Ada Lovelace", "role": "buyer", "country": "GB", "business_type": null }
```

`role` must be `buyer` or `seller`. Returns **201** with the user object, `status: "pending_verification"`. A verification email is sent. **The user cannot sign in until they verify.**

#### `POST /auth/login`
```json
{ "email": "ada@example.com", "password": "min-12-characters" }
```
Returns **200** `{ "access_token": "...", "token_type": "bearer", "expires_in": 900 }` and sets the refresh cookie. Send with `credentials: "include"`.

#### `POST /auth/refresh`
No body. Reads the cookie, rotates it, returns a new access token. Send with `credentials: "include"`.

#### `POST /auth/verify-email`
`{ "token": "<from the emailed link>" }` → 200. Sets the account to `active`.

#### `POST /auth/resend-verification`
`{ "email": "..." }` → **202**, always the same message whether or not the account exists (no account enumeration).

#### `POST /auth/forgot-password`
`{ "email": "..." }` → **202**, same generic response.

#### `POST /auth/reset-password`
`{ "token": "...", "password": "new-min-12" }` → 200.

This one endpoint serves **two** flows:
- the user clicked "forgot password" (link path `/reset-password?token=...`)
- a super admin created a staff account and they're setting their first password (link path `/set-password?token=...`)

Both land here. Build both pages; they POST to the same place. A reset link is **single-use** — it dies the moment the password changes. Resetting also signs the user out of every device.

### Authenticated (`Authorization: Bearer <access_token>`)

#### `GET /auth/me`
The session object. **Call this after sign-in and cache it — it drives your whole UI.**

```json
{
  "id": "0f8f…", "email": "ada@example.com", "full_name": "Ada Lovelace",
  "status": "active", "country": "GB", "business_type": null,
  "email_verified_at": "2026-07-14T09:12:04Z", "last_login_at": "2026-07-14T09:30:11Z",
  "roles": ["buyer"],
  "permissions": {
    "buyer_crm": "none", "seller_crm": "none", "lead_management": "none",
    "asset_management": "view", "auction_management": "view", "bid_management": "full",
    "marketing_campaigns": "none", "ai_configuration": "none", "payment_escrow": "full",
    "reports": "view", "system_settings": "none", "user_management": "none",
    "notifications": "full"
  }
}
```

#### `POST /auth/change-password`
`{ "current_password": "...", "new_password": "min-12" }` → **204**. Signs the user out everywhere; re-authenticate.

#### `POST /auth/logout`
No body. Send **both** the bearer token and `credentials: "include"` so the server can revoke the refresh family *and* denylist the access token immediately. → **204**.

#### `POST /auth/roles/seller`
`{ "business_type": "private_collector" }` (optional field). Adds the `seller` role to an existing **buyer** on the same account — the client confirmed a buyer becomes a seller with the same user ID and both roles. Returns the updated session object with the new merged `permissions`. Re-render the nav off the response.

### Super Admin only (`user_management`)

`GET` needs `view`, everything else needs `full`. Per the matrix, only Super Admin has `full`; Auction Manager has `view` (can list, cannot mutate).

| Endpoint | Notes |
| --- | --- |
| `POST /admin/users` | `{ email, full_name, roles: ["auction_manager"], country? }`. **Rejects `buyer`/`seller` with 422** — those must self-register. Creates the account with no password and emails a set-password invite. |
| `GET /admin/users` | `?page=1&size=25&search=&role=&status=` → `{ items, total, page, size }` |
| `GET /admin/users/{id}` | Single user |
| `PATCH /admin/users/{id}` | `{ status?: "active"\|"suspended", roles?: [...], full_name? }`. Suspending instantly revokes every session. Cannot target yourself. |
| `DELETE /admin/users/{id}` | Soft delete (status → `deleted`, sessions revoked). Records are preserved so future bids/auctions keep their foreign keys. Cannot target yourself. |

---

## 4. Driving the UI off `permissions`

Nine roles exist: `super_admin`, `auction_manager`, `marketing`, `legal`, `finance`, `gemologist`, `buyer`, `seller`, `executive`.

**Do not write `if (role === "buyer")` anywhere.** A user can hold several roles at once (buyer + seller; the Director holds `super_admin`), and permissions are the *union* of their roles. Read `permissions[module]` instead — it's already resolved for you.

Each of the 13 modules resolves to exactly one of `"full" | "view" | "none"`:

```ts
const rank = { none: 0, view: 1, full: 2 } as const;
const can = (p: Session["permissions"], m: string, need: keyof typeof rank) =>
  rank[p[m] as keyof typeof rank] >= rank[need];

can(session.permissions, "bid_management", "full");   // show the Place Bid button
can(session.permissions, "auction_management", "view"); // show the auctions tab, read-only
```

Modules: `buyer_crm`, `seller_crm`, `lead_management`, `asset_management`, `auction_management`, `bid_management`, `marketing_campaigns`, `ai_configuration`, `payment_escrow`, `reports`, `system_settings`, `user_management`, `notifications`.

This is **UI convenience only** — the server re-checks every permission on every request. Hiding a button is not security; the API is.

---

## 5. The dev mailbox — read this before you build the signup screen

**No email provider is wired up yet.** Outside production the API keeps the last 50 messages it *would* have sent, and serves them:

```
GET    /api/v1/dev/emails     # newest first
DELETE /api/v1/dev/emails     # clear
```

```json
[{ "to": "ada@example.com", "subject": "Verify your Provenix account",
   "body": "http://localhost:3000/verify-email?token=eyJhbGci…",
   "sent_at": "2026-07-14T09:12:04+00:00" }]
```

So the **entire** signup, password-reset and staff-invite flow is testable end-to-end today: register → `GET /dev/emails` → pull the token out of `body` → `POST /auth/verify-email` → log in. Same for reset and invites.

These routes **only exist when the API is not in production** — don't ship anything that depends on them.

---

## 6. Things that will bite you

- **Password minimum is 12 characters.** No symbol/digit/uppercase rules (NIST guidance: length beats composition). Mirror exactly that in your validation, or users hit a 422 they didn't expect.
- **Register → cannot log in.** Registration returns `pending_verification`. Send them to a "check your inbox" screen, not the dashboard.
- **Logout and password change kill the caller's access token instantly** (it goes on a denylist). After either, drop your in-memory token and re-authenticate.
- **Suspension takes effect on the next request**, not on token expiry. A suspended user's in-flight access token returns 401 immediately. Handle 401 anywhere, at any time.
- **Five failed sign-ins locks the account for 15 minutes** (`423 account_locked`) — even if the sixth attempt uses the *correct* password. Show a clear message rather than "wrong password".
- **There is an IP rate limit** on register (10/hour), login (20 per 5 min), and forgot-password / resend-verification (5/hour). Exceeding it returns `429 rate_limited`. Don't retry in a tight loop.
- **Local dev CORS**: the API allows `http://localhost:3000` and `allow_credentials: true`. If you run the frontend on another port, it must be added to `PROVENIX_CORS_ORIGINS`.
- **The cookie is `SameSite=Lax` and path-scoped to `/api/v1/auth`.** If the API is served from a different registrable domain than the frontend in production, it must move to `SameSite=None; Secure` — tell the backend before you deploy.

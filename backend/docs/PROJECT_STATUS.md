# Provenix — Project Status & Backend Guide

**Running context file. Read this first to understand where the backend is today.**
Update the Daily Log at the bottom whenever meaningful backend work ships.

- **Last updated:** 2026-07-21
- **Active branch:** `feature/future-apis` (ahead of `main`, pushed to origin; `main` merged in)
- **Companion docs:** `PROJECT_CONTEXT.txt` (business + product context), `AUTH_API.md` and
  `AUCTION_API.md` (frontend contracts for the earlier work).

---

## 1. Current status snapshot

The backend now covers **every feature listed in `future-apis-whole-project.docx`** — buyer, seller,
staff/admin, and the previously "not designed / deferred" items (messaging, CRM, campaigns, listing
analytics, location search, escrow).

What this means for the frontend team: there is a real endpoint behind every screen in the
navigation now. Nothing on the API side is blocking frontend work.

Two things need a human before this is production-usable:
- **Run the migration** (`alembic upgrade head`) — see section 3.
- **Approve KYC for test buyers**, otherwise bidding and buying return `403 kyc_required`
  (this gating is new and intentional — see section 6).

---

## 2. Backend setup (first time)

```bash
cd backend
docker compose -f infra/docker/docker-compose.yml up -d     # postgres + redis (+ minio)
python -m venv .venv && .venv/Scripts/activate              # source .venv/bin/activate on unix/mac
pip install -e ".[dev]"
cp .env.example .env                                        # then set PROVENIX_JWT_SECRET
alembic upgrade head
BOOTSTRAP_EMAIL=director@provenix.io BOOTSTRAP_PASSWORD=<strong-pass> python -m app.bootstrap
uvicorn app.main:app --reload
```

Interactive API docs (every endpoint, try-it-out): <http://localhost:8000/docs>

---

## 3. Migrations — how to pick up this work

All new tables and columns live in Alembic migrations, so you never hand-edit the database.

```bash
git fetch origin
git checkout feature/future-apis      # or pull main once it's merged
cd backend
alembic upgrade head                  # applies everything up to 0006
```

- `alembic upgrade head` — apply all pending migrations (safe to run repeatedly).
- `alembic heads` — should print a single head: `0006 (head)`.
- `alembic history` — shows the full chain (`0001 → 0006`).
- `alembic downgrade -1` — roll back one migration if you need to.

Migration chain, newest last:

- `0005_future_apis` — `watchlist_items` table + `payout` wallet-ledger kind.
- `0006_crm_messaging_escrow` — `messages`, `leads`, `campaigns`, `property_views`, `escrows`
  tables; their enums; and `latitude` / `longitude` columns on `properties`.
- `0007_categories` — `categories` table; replaces the hardcoded `property_category` enum with a
  `category_id` foreign key on `properties`. **Data-migrating:** it seeds `Residential` and
  `Commercial`, moves every existing listing onto them, then drops the old column and enum type. No
  listing data is lost.

**When you add a model or column yourself:**
1. Write/change the model under `app/models/`.
2. Register the model module in `alembic/env.py` (the `from app.models import ...` list) so its table
   is on `Base.metadata`.
3. Create a migration file under `alembic/versions/` following the `0006_*` example — set
   `down_revision` to the current head, create enums with `create_type=False` + `.create(bind,
   checkfirst=True)`, and add an `ALTER TYPE ... ADD VALUE IF NOT EXISTS` for new enum *values*.
4. `alembic upgrade head`, then `ruff check . && black .`.

---

## 4. Architecture (unchanged conventions)

- `app/api/v1/*` — HTTP layer only, no business logic. One router per area, registered in
  `app/api/v1/router.py`.
- `app/services/*` — all business logic and database access.
- `app/schemas/*` — Pydantic request/response models. Money is `Numeric(12,2)` → decimal string in
  JSON. Timestamps must carry an offset.
- `app/models/*` — SQLAlchemy models.
- `app/rbac/permissions.py` — the role/module access matrix, the single source of truth for
  authorization. New endpoints gate on existing modules; no matrix cell was changed.
- Error envelope is unchanged: `{"error": {"code": "...", "message": "..."}}`.

---

## 5. All endpoints added on this branch

Everything below needs `Authorization: Bearer <access_token>`. "Own data" routes work for any
signed-in user; staff routes gate on the permission matrix.

**Auction categories (staff write via `asset_management` full, read via view)**

- `POST /api/v1/categories` — create, body `{ name, parent_id? }`. Omit `parent_id` for a main
  category; pass one to create a subcategory under it. `slug` is generated from the name.
- `GET /api/v1/categories` — every main category with its subcategories nested in `children`. One
  call fills a browse filter.
- `GET /api/v1/categories/{id}` — one category with its children.
- `PATCH /api/v1/categories/{id}` — rename (re-slugs) or re-parent.
- `DELETE /api/v1/categories/{id}` — removes it and its subcategories. `409 category_in_use` while
  any listing still references it.
- Filter listings with `GET /api/v1/properties?category_id=<uuid>`. Passing a **main** category also
  returns everything in its subcategories.

Rules the service enforces: the tree is exactly two levels deep (`422 nested_too_deep` if you try to
nest under a subcategory, or to re-parent a category that has children), names are unique
(`409 category_exists`), and a category cannot become its own parent.

**Buyer self-service**

- `POST /api/v1/watchlist` — save a property, body `{ property_id }`.
- `GET /api/v1/watchlist` — the caller's saved properties (returns `PropertyOut[]`).
- `DELETE /api/v1/watchlist/{property_id}` — un-save.
- `GET /api/v1/users/me/bids` — every auction the caller bid on, with their top bid and a `won` flag.
- `GET /api/v1/users/me/auction-invites` — private auctions the caller was invited to.

**Seller self-service**

- `GET /api/v1/users/me/properties` — the caller's own listings, votes included so they see approval
  status.
- `GET /api/v1/properties/{id}/analytics` — interest a listing drew: `views`, `unique_viewers`,
  `watchlist_count`, `bids`, `bidders`. Open to the listing's own seller or asset-management staff.

**Listing analytics + search (any signed-in user)**

- `POST /api/v1/properties/{id}/views` — record that the caller viewed a listing (feeds analytics).
- `GET /api/v1/properties?lat=&lng=&radius_km=` — radius search. All three params are required
  together; coordinates come from the new `latitude` / `longitude` fields on create/update.

**Messaging (any signed-in user)**

- `POST /api/v1/messages` — send, body `{ recipient_id, body, property_id? }`.
- `GET /api/v1/messages` — conversation list: counterpart, last message, unread count.
- `GET /api/v1/messages/{other_user_id}` — the full thread; fetching marks the other side's messages
  read.

**CRM (staff)**

- `GET /api/v1/crm/buyers` — buyers with activity stats (bids, auctions won, properties bought).
  Gated `buyer_crm` view.
- `GET /api/v1/crm/sellers` — sellers with stats (listings, sold, payouts). Gated `seller_crm` view.
- `POST /api/v1/crm/leads` · `GET /api/v1/crm/leads` · `GET /api/v1/crm/leads/{id}` ·
  `PATCH /api/v1/crm/leads/{id}` · `DELETE /api/v1/crm/leads/{id}` — lead tracking. Gated
  `lead_management` (view to read, full to write).

**Marketing campaigns (staff, `marketing_campaigns`)**

- `POST /api/v1/campaigns` · `GET /api/v1/campaigns` · `GET /api/v1/campaigns/{id}` ·
  `PATCH /api/v1/campaigns/{id}` · `DELETE /api/v1/campaigns/{id}`.
- `POST /api/v1/campaigns/{id}/send` — marks it sent (channel delivery itself is not wired yet).

**Escrow settlement (staff, `payment_escrow` full)**

- `GET /api/v1/escrow` — list, filter `?state=`.
- `GET /api/v1/escrow/{id}`.
- `POST /api/v1/escrow/{id}/advance` — move one step through
  `funds_locked → asset_held → authenticated → released`; reaching `released` pays the seller.

**Reports (staff, `reports` view)**

- `GET /api/v1/reports/revenue` — totals split auction vs direct, sales count, monthly series.
- `GET /api/v1/reports/auction-activity` — auctions by state, total bids, weekly series.

**Admin**

- `DELETE /api/v1/admin/users/{id}?hard=true` — hard-delete a user for good. Without `hard` it stays
  the existing soft-delete.

**Already existed before this branch (confirmed, not rebuilt):** wallet withdraw + transactions,
`POST /kyc` + `GET /kyc/me`, notifications, the live-bidding WebSocket, `POST /auctions/{id}/invites`,
`DELETE /properties/{id}`, and property approval votes.

---

## 6. Important behaviour changes to know about

- **BREAKING — categories replaced the hardcoded enum.** `category` (`"residential" | "commercial"`)
  is gone from the property contract. The platform is no longer real-estate-only: any category, in
  any domain, can be created at runtime. What changed for the frontend:
  - `POST /properties` and `PATCH /properties/{id}` now take **`category_id`** (a UUID), not
    `category`.
  - `PropertyOut` and `AuctionOut` now return **`category_id` + `category_name`** instead of
    `category`.
  - `GET /properties?category=` is now **`?category_id=`**.
  - `GET /reports/dashboard` → `category_mix[].category` is now a **category name string**, and only
    categories that actually have listings appear.
  - Populate any category dropdown from `GET /categories`.
- **KYC is now enforced.** `POST /auctions/{id}/bids` and `POST /properties/{id}/purchase` require the
  user to have an **approved** KYC submission, else `403 kyc_required`. Approve test buyers via
  `PATCH /admin/kyc/{submission_id}` (they must submit `POST /kyc` first).
- **Escrow now owns settlement.** A Buy Now or an auction award debits the buyer and opens an
  **escrow** in `funds_locked` — the seller is **not** paid immediately. Staff walk the escrow to
  `released` (via `POST /escrow/{id}/advance`), which is what credits the seller's wallet (a `payout`
  ledger entry). A staff-listed property with no seller has no escrow; its funds stay with the
  platform. This replaces the interim "instant seller credit" and is the coherent version of the
  doc's `FUNDS_LOCKED → ASSET_HELD → AUTHENTICATED → RELEASED` pipeline.
- **Location search is coordinate-based, not geocoding.** `latitude`/`longitude` are settable on a
  property and the radius filter works off them. Turning a typed address into coordinates
  (geocoding) still needs a provider and is not wired — populate the two fields and search works.

---

## 7. What is intentionally NOT built

- **Channel delivery for campaigns** — `send` flips status/`sent_at`; it does not push to an email/SMS
  provider yet (same pattern as `app/services/mail.py` being a placeholder).
- **Geocoding** (address → lat/lng) — see above.
- **The AI layer** (pricing, matching, outreach) — out of scope for this backend pass.

---

## 8. Verification done for this branch (no Docker was run)

- `ruff check` clean, `black` formatted.
- App imports and the full OpenAPI schema builds (59 routes).
- The non-trivial queries (messaging `DISTINCT ON`, CRM aggregate joins, haversine radius, `FILTER`
  aggregates) compile to valid PostgreSQL.
- Alembic chain is linear with a single head (`0006`).
- No existing tests are affected (only `tests/test_auth.py` exists; there are no bid/purchase tests).

---

## Daily Log

### 2026-07-21 — auction categories (any domain, not just real estate)

Merged the teammate's `main` (KYC/live-auction/wallet/notification frontend, plus their
`GET /admin/kyc/{id}/documents/{key}` backend endpoint) into the branch — no conflicts.

Replaced the hardcoded `property_category` enum with a real, CRUDable **two-level category tree**, so
the platform can auction anything — real estate, jewellery, any domain — instead of two fixed
property types. Main categories and subcategories share one table and one set of endpoints.

- New `categories` table (self-referencing `parent_id`), full CRUD at `/api/v1/categories`.
- `properties.category_id` foreign key replaces the enum column; migration `0007` seeds the two old
  values and moves existing listings across, so nothing is lost.
- Browse filter `?category_id=` rolls a main category up to include its subcategories.
- Reports, `PropertyOut` and `AuctionOut` all updated to carry `category_id` + `category_name`.

**This is a breaking API change for the frontend** — see the first bullet in section 6.

### 2026-07-20 — future-APIs backend pass

Pulled the teammate's `main` (was 4 commits behind) and worked through
`future-apis-whole-project.docx` end to end. Two commits on `feature/future-apis`:

- **Commit 1** — watchlist, `users/me` self-service (bids, invites, properties), revenue &
  auction-activity reports, hard-delete-user option, and KYC enforcement on bids/purchase. Migration
  `0005`.
- **Commit 2** — messaging, CRM (buyers/sellers/leads), campaigns, escrow settlement state machine,
  listing view analytics, and coordinate/radius property search. Escrow took over seller settlement.
  Migration `0006`.

Everything in the doc that had a concrete design is now built. Nothing API-side blocks the frontend.
Next: merge to `main` after review, run `alembic upgrade head`, approve KYC for test buyers.

# Auction API - frontend contract

Companion to `AUTH_API.md`. Covers properties, auctions, bidding and wallets.

Every route needs `Authorization: Bearer <access_token>`. Errors use the existing envelope:
`{"error": {"code": "...", "message": "..."}}`.

**Money is sent and returned as a decimal string** (`"425000.00"`), never a float - JSON floats cannot
hold money exactly. Format it for display on the client; do not do arithmetic on it as a number.

**Timestamps must carry an offset** (`2026-07-20T15:00:00Z`). A naive datetime is rejected with 422.

**On PATCH, `null` means "leave unchanged"**, not "clear this field" - omitting a key and sending
`null` do the same thing. Send `""` to blank a `description` or `image_url`.

## Who can do what

"Admin/Supervisor" in the task list maps onto the two roles that hold **full** `auction_management`
in the existing permission matrix: `super_admin` and `auction_manager`. No new role was added, and
no matrix cell was changed. The frontend's `AuctionViewerRole` (`customer | admin | supervisor`) is
presentation vocabulary - the server authorises off the matrix, as every other route does.

| Action | Module | Level |
|---|---|---|
| Create / edit properties | `asset_management` | full (`super_admin`, `auction_manager`, `seller`) |
| View properties | `asset_management` | view |
| Create / edit / award / end auctions, invite, see participants | `auction_management` | full (`super_admin`, `auction_manager`) |
| View auctions | `auction_management` | view (not `marketing`) |
| Place a bid | `bid_management` | full **and** must hold the `buyer` role |
| View the bid list | `bid_management` | view |
| Wallet | `payment_escrow` | full (`super_admin`, `finance`, `buyer`, `seller`) |

## Properties

    POST   /api/v1/properties            title, address, category, reserve_price, description?,
                                         image_url?, bedrooms?, bathrooms?, area_sqft?
    GET    /api/v1/properties            ?page&size&search&category&status&min_price&max_price
    GET    /api/v1/properties/{id}
    PATCH  /api/v1/properties/{id}       any of the above, plus status: draft | published

`category` is `residential | commercial`. `status` is `draft | published | sold`; **`sold` is set only
by an award** and a sold property can no longer be edited. Only a `published` property can be
auctioned.

`bedrooms`, `bathrooms` and `area_sqft` are optional whole numbers - null on commercial lots, where
they do not apply. Half-baths are not modelled.

`PropertyOut` returns `seller_name` alongside `seller_id`, so an approvals queue never has to show a
bare UUID. Both are null for a staff-created listing; a property created by a seller records them.

`search` matches title and address. `min_price`/`max_price` filter on `reserve_price`. There is no
location/radius search - that needs geocoding and is not built.

## Auctions

    POST   /api/v1/auctions              property_id, starts_at, ends_at, opening_bid,
                                         reserve_price, increments[], room_access?, token_percent?
    GET    /api/v1/auctions              ?page&size&status
    GET    /api/v1/auctions/{id}
    PATCH  /api/v1/auctions/{id}         ends_at?, reserve_price?, room_access?, increments?
    POST   /api/v1/auctions/{id}/end     close with no sale
    POST   /api/v1/auctions/{id}/award   { bidder_id }

`status` is **derived, never stored**: `ended` if an admin settled it or `ends_at` has passed, else
`live` once `starts_at` has passed, else `upcoming`. So it is always honest and cannot drift.

`AuctionOut` carries `title`, `address`, `category` and `image_url` from the property, plus
`current_bid` (null until the first bid), `minimum_bid`, `bidder_count` and `winner_id`.

**The timer.** `ends_at` is authoritative and lives on the server. Bids never extend it - the client
confirmed "auctions are NOT auto-extended". Only Admin/Supervisor may move it, via PATCH, and only
to a time after both `starts_at` and now. Render the countdown by counting down to `ends_at`
locally; do not keep a client-side clock of your own.

**Filters before the room opens.** `room_access` (`open | invite_only`) and `increments` may only be
changed while the auction is `upcoming` - 409 `auction_live` afterwards. `ends_at` and
`reserve_price` stay editable until it ends.

## Bidding

    POST   /api/v1/auctions/{id}/bids           { amount }
    GET    /api/v1/auctions/{id}/bids           bid_id, bidder_id, amount, created_at
    GET    /api/v1/auctions/{id}/participants   Admin/Supervisor only

`increments` is the auction's quick-bid buttons (e.g. `["10.00", "50.00"]`). A **custom** bid and a
**button** bid go through the same endpoint and the same rule: `amount >= minimum_bid`, where
`minimum_bid` is the opening bid until someone bids, then top bid + the smallest increment. Build the
buttons as `current_bid + increment`.

The bid list deliberately exposes ids only, not names. `/participants` is where Admin/Supervisor see
who is in the room: `full_name`, `email`, `top_bid`, `bid_count`, `last_bid_at`, ranked by top bid.

**Awarding.** Admin/Supervisor choose the winner - it does **not** have to be the highest bidder, and
the reserve price is **not** enforced at award. Awarding charges the winner's wallet, ends the
auction and marks the property `sold`. Every other bidder's funds free up at the same moment.

Refusals: 409 `auction_not_live`, 409 `bid_too_low`, 403 `not_invited`, 409 `insufficient_funds`.

## Wallet

    GET  /api/v1/wallet          { balance, held, available }
    POST /api/v1/wallet/top-up   { amount }

One wallet per user, created on first access. `available = balance - held`; **bid against
`available`**, not `balance`.

`token_percent` on the auction decides what a bid locks: `100` (the default) locks the whole bid -
full payment. A lower value takes a token deposit instead, e.g. `10` locks 10% of the bid.

Money is locked by *placing* a bid and released by the **settlement**, not by the clock. A bidder's
exposure on an auction is their own highest bid on it, so raising your own bid costs only the
difference. Losing needs no refund step - once the auction is awarded or ended, the bid stops
counting against the wallet. This is why an expired auction still holds funds until an admin calls
award or end: otherwise a winner could spend what they owe before being picked.

## Real time (WebSocket)

    ws://localhost:8000/api/v1/auctions/{id}/ws?token=<access_token>

A browser cannot set an `Authorization` header on a WebSocket handshake, so the access token goes in
the query string. Same rules as the REST routes: `auction_management` view access. Close codes:
**4401** not authenticated or not allowed, **4404** no such auction.

Every message is the same shape - a type and **the whole auction**:

    { "type": "snapshot" | "bid" | "updated" | "ended", "auction": AuctionOut }

- `snapshot` - sent once, immediately on connect, so you start in sync
- `bid` - someone bid; `current_bid`, `minimum_bid` and `bidder_count` are already updated
- `updated` - an admin changed the timer, reserve, or room settings
- `ended` - awarded or closed; read `winner_id` and `status`

The auction is always sent whole, never as a delta, so **render the latest message and drop your old
state** - there is nothing to merge, and a reconnect is instantly correct. Count the clock down
locally against `ends_at`; the server never streams ticks.

Broadcasting is best-effort: if Redis drops a message the write still succeeded. Reconnect to get a
fresh `snapshot`. Polling `GET /auctions/{id}` still works and remains a fine fallback.

Bidder *names* are never pushed - the room only carries `bidder_count`. Admins read
`/participants` over REST for identities.

## Wallet transactions

    GET  /api/v1/wallet/transactions   ?limit=50
    POST /api/v1/wallet/withdraw       { amount }

`kind` is `deposit | withdrawal | bid_hold | refund | purchase`. `amount` is signed the way a user
reads it - money in positive, money out negative - and `related_to` carries the property title when
the entry belongs to an auction.

**This list is an activity log, not a ledger: do not sum it to get a balance.** `bid_hold` and
`refund` are encumbrances rather than balance movements, so they deliberately do not add up. Read
`balance`, `held` and `available` from `GET /api/v1/wallet`.

Placing a bid writes `bid_hold`. Settling writes `refund` for **every** bidder (the winner included,
closing their hold), plus `purchase` for the winner - so the log nets to zero for a loser and to the
price for the winner.

Withdrawal is capped at `available`, never `balance`: money behind a live bid is already committed
to it.

## Sign-off (2 of 3)

    POST /api/v1/properties/{id}/votes   { approved }

A draft listing goes live only on the client's 2-of-3 quorum. Three seats, one vote each - your seat
comes from your role, you never name it:

| Seat | Held by |
|---|---|
| `director` | `super_admin` |
| `appraiser` | `gemologist` |
| `legal_finance` | `legal` **or** `finance` |

The second matching vote settles it: two approvals publish the listing, two rejections set it
`rejected`. Until then it stays `draft`. Voting again replaces your seat's earlier vote. `PropertyOut`
carries `votes[]` with `seat`, `voter_name`, `approved` and `decided_at`, so the queue renders the
panel without extra calls. 403 `not_an_approver` if you hold no seat; 409 `already_decided` once it
has settled.

The approvals queue is `GET /api/v1/properties?status=draft`.

## Buy Now

    POST /api/v1/properties/{id}/purchase   { method: "full" | "token" }

Buys a `published` listing outright, charged against the wallet. `full` (the default) pays
`reserve_price`; `token` reserves it for `PROVENIX_PURCHASE_TOKEN_PERCENT` of the price (10% by
default). The listing becomes `sold` and carries `buyer_id`, `payment_method`, `paid_amount` and
`purchased_at`.

Buyers only, and never while an auction on that property is unsettled - 409 `auction_running`. This
is separate from `token_percent` on an auction, which is a **bid deposit**, not a purchase.

## Notifications

    GET  /api/v1/notifications        ?limit&unread_only   -> { items, unread }
    POST /api/v1/notifications/read   { ids? }             omit ids to mark all read

`kind` is `outbid | auction_won | auction_lost | property_approved | property_rejected |
kyc_reviewed`, with `auction_id` / `property_id` to link from. Written when you are outbid, when an
auction settles (winner and losers both), when a listing is signed off, and when KYC is reviewed.

## Uploads

    POST /api/v1/uploads/presign   { content_type, purpose: "property" | "kyc" }

Returns `{ key, upload_url, content_type, expires_in }`. **PUT the file straight to `upload_url`**
with exactly that `Content-Type` - bytes never touch this API - then send `key` back on the create or
update. `property` keys are publicly readable; `kyc` keys are not. Accepts jpeg, png, webp, avif and
pdf. Needs the `minio` service from the compose file.

## KYC

    POST  /api/v1/kyc                      { legal_name, document_keys[] }
    GET   /api/v1/kyc/me                   204 when never submitted
    GET   /api/v1/admin/kyc                ?page&size&status
    PATCH /api/v1/admin/kyc/{id}           { approved, notes? }

`document_keys` are keys from `/uploads/presign`, not URLs. One live submission per user; a rejected
applicant resubmits onto the same row, an approved one is final. The review queue needs
`user_management` full access and returns `full_name` and `email` alongside each pack.

## Dashboard

    GET /api/v1/reports/dashboard

Every headline number in one call: `total_buyers`, `total_sellers`, `active_auctions`,
`total_listings`, `published_listings`, `sold_listings`, `pending_approvals`, `total_revenue`,
`category_mix[]` and `weekly_signups[]` (last 8 weeks). Needs `reports` view access. Revenue counts
awarded auctions plus direct Buy Now payments.

## Google Calendar

No endpoint needed. `AuctionOut` returns `title`, `starts_at` and `ends_at`; the existing
`lib/utils/googleCalendar.ts` builds the link from those on the client, for every role.

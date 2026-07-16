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

    POST   /api/v1/properties            title, address, category, reserve_price, description?, image_url?
    GET    /api/v1/properties            ?page&size&search&category&status
    GET    /api/v1/properties/{id}
    PATCH  /api/v1/properties/{id}       any of the above, plus status: draft | published

`category` is `residential | commercial`. `status` is `draft | published | sold`; **`sold` is set only
by an award** and a sold property can no longer be edited. Only a `published` property can be
auctioned. A property created by a seller records their id in `seller_id`.

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

## Real time

There is no websocket. The server is the source of truth for the clock (`ends_at`) and the price
(`current_bid`), and `GET /api/v1/auctions/{id}` returns both in one call - poll it while a room is
open and count the timer down locally between polls. That is enough for a live room and costs no
extra moving parts. If the demo needs push instead of poll, a Redis pub/sub broadcast is the upgrade
path, and nothing above has to change.

## Google Calendar

No endpoint needed. `AuctionOut` returns `title`, `starts_at` and `ends_at`; the existing
`lib/utils/googleCalendar.ts` builds the link from those on the client, for every role.

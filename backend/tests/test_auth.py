from httpx import AsyncClient

from tests.conftest import SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, latest_token

BUYER = {
    "email": "buyer@example.com",
    "password": "CorrectHorseBattery1",
    "full_name": "Ada Buyer",
    "role": "buyer",
    "country": "GB",
}
REFRESH = "provenix_refresh"


async def register_and_verify(client: AsyncClient) -> None:
    created = await client.post("/api/v1/auth/register", json=BUYER)
    assert created.status_code == 201, created.text
    assert created.json()["status"] == "pending_verification"

    verified = await client.post("/api/v1/auth/verify-email", json={"token": latest_token()})
    assert verified.status_code == 200


async def login(client: AsyncClient, email: str, password: str) -> str:
    response = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


async def bearer(client: AsyncClient, email: str, password: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {await login(client, email, password)}"}


def use_refresh_cookie(client: AsyncClient, token: str) -> None:
    client.cookies.clear()
    client.cookies.set(REFRESH, token)


async def test_unverified_user_cannot_sign_in(client: AsyncClient) -> None:
    await client.post("/api/v1/auth/register", json=BUYER)

    response = await client.post(
        "/api/v1/auth/login", json={"email": BUYER["email"], "password": BUYER["password"]}
    )
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "email_not_verified"


async def test_session_exposes_matrix_permissions(client: AsyncClient) -> None:
    await register_and_verify(client)
    headers = await bearer(client, BUYER["email"], BUYER["password"])

    response = await client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200

    body = response.json()
    assert body["roles"] == ["buyer"]
    assert body["permissions"]["bid_management"] == "full"
    assert body["permissions"]["auction_management"] == "view"
    assert body["permissions"]["user_management"] == "none"


async def test_refresh_rotation_detects_token_reuse(client: AsyncClient) -> None:
    await register_and_verify(client)
    await login(client, BUYER["email"], BUYER["password"])
    stolen = client.cookies[REFRESH]

    rotated = await client.post("/api/v1/auth/refresh")
    assert rotated.status_code == 200
    current = client.cookies[REFRESH]
    assert current != stolen

    use_refresh_cookie(client, stolen)
    assert (await client.post("/api/v1/auth/refresh")).status_code == 401

    use_refresh_cookie(client, current)
    assert (await client.post("/api/v1/auth/refresh")).status_code == 401


async def test_password_reset_is_single_use_and_kills_sessions(client: AsyncClient) -> None:
    await register_and_verify(client)
    await login(client, BUYER["email"], BUYER["password"])

    await client.post("/api/v1/auth/forgot-password", json={"email": BUYER["email"]})
    reset_token = latest_token()

    reset = await client.post(
        "/api/v1/auth/reset-password", json={"token": reset_token, "password": "BrandNewSecret99"}
    )
    assert reset.status_code == 200
    assert (await client.post("/api/v1/auth/refresh")).status_code == 401

    replayed = await client.post(
        "/api/v1/auth/reset-password", json={"token": reset_token, "password": "AnotherSecret77"}
    )
    assert replayed.status_code == 400

    await login(client, BUYER["email"], "BrandNewSecret99")


async def test_repeated_failures_lock_the_account(client: AsyncClient) -> None:
    await register_and_verify(client)

    for _ in range(5):
        failed = await client.post(
            "/api/v1/auth/login", json={"email": BUYER["email"], "password": "WrongPassword123"}
        )
        assert failed.status_code == 401

    locked = await client.post(
        "/api/v1/auth/login", json={"email": BUYER["email"], "password": BUYER["password"]}
    )
    assert locked.status_code == 423
    assert locked.json()["error"]["code"] == "account_locked"


async def test_logout_invalidates_the_access_token_immediately(client: AsyncClient) -> None:
    await register_and_verify(client)
    headers = await bearer(client, BUYER["email"], BUYER["password"])

    assert (await client.post("/api/v1/auth/logout", headers=headers)).status_code == 204
    assert (await client.get("/api/v1/auth/me", headers=headers)).status_code == 401
    assert (await client.post("/api/v1/auth/refresh")).status_code == 401


async def test_change_password_signs_every_device_out(client: AsyncClient) -> None:
    await register_and_verify(client)
    headers = await bearer(client, BUYER["email"], BUYER["password"])

    wrong = await client.post(
        "/api/v1/auth/change-password",
        headers=headers,
        json={"current_password": "NotMyPassword1", "new_password": "RotatedSecret42"},
    )
    assert wrong.status_code == 400
    assert wrong.json()["error"]["code"] == "invalid_password"

    changed = await client.post(
        "/api/v1/auth/change-password",
        headers=headers,
        json={"current_password": BUYER["password"], "new_password": "RotatedSecret42"},
    )
    assert changed.status_code == 204
    assert (await client.get("/api/v1/auth/me", headers=headers)).status_code == 401
    assert (await client.post("/api/v1/auth/refresh")).status_code == 401

    await login(client, BUYER["email"], "RotatedSecret42")


async def test_buyer_enrols_as_seller_on_the_same_account(client: AsyncClient) -> None:
    await register_and_verify(client)
    headers = await bearer(client, BUYER["email"], BUYER["password"])

    enrolled = await client.post(
        "/api/v1/auth/roles/seller", headers=headers, json={"business_type": "private_collector"}
    )
    assert enrolled.status_code == 200

    body = enrolled.json()
    assert body["roles"] == ["buyer", "seller"]
    assert body["permissions"]["asset_management"] == "full"
    assert body["permissions"]["seller_crm"] == "view"
    assert body["permissions"]["bid_management"] == "full"


async def test_user_management_follows_the_role_matrix(
    client: AsyncClient, super_admin: None
) -> None:
    admin = await bearer(client, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD)

    created = await client.post(
        "/api/v1/admin/users",
        headers=admin,
        json={
            "email": "manager@provenix.io",
            "full_name": "Mia Manager",
            "roles": ["auction_manager"],
        },
    )
    assert created.status_code == 201, created.text
    assert created.json()["status"] == "pending_verification"

    accepted = await client.post(
        "/api/v1/auth/reset-password",
        json={"token": latest_token(), "password": "ManagerPass2024"},
    )
    assert accepted.status_code == 200

    manager = await bearer(client, "manager@provenix.io", "ManagerPass2024")
    assert (await client.get("/api/v1/admin/users", headers=manager)).status_code == 200

    blocked = await client.post(
        "/api/v1/admin/users",
        headers=manager,
        json={"email": "nope@provenix.io", "full_name": "No Way", "roles": ["marketing"]},
    )
    assert blocked.status_code == 403

    await register_and_verify(client)
    buyer = await bearer(client, BUYER["email"], BUYER["password"])
    assert (await client.get("/api/v1/admin/users", headers=buyer)).status_code == 403


async def test_staff_cannot_create_buyer_or_seller_accounts(
    client: AsyncClient, super_admin: None
) -> None:
    admin = await bearer(client, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD)

    rejected = await client.post(
        "/api/v1/admin/users",
        headers=admin,
        json={"email": "buyer2@example.com", "full_name": "Proxy Buyer", "roles": ["buyer"]},
    )
    assert rejected.status_code == 422
    assert rejected.json()["error"]["code"] == "validation_error"


async def test_admin_cannot_suspend_or_delete_themselves(
    client: AsyncClient, super_admin: None
) -> None:
    admin = await bearer(client, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD)
    me = (await client.get("/api/v1/auth/me", headers=admin)).json()["id"]

    suspended = await client.patch(
        f"/api/v1/admin/users/{me}", headers=admin, json={"status": "suspended"}
    )
    assert suspended.status_code == 409
    assert suspended.json()["error"]["code"] == "self_modification"

    assert (await client.delete(f"/api/v1/admin/users/{me}", headers=admin)).status_code == 409


async def test_deleted_user_is_gone_but_rows_survive(
    client: AsyncClient, super_admin: None
) -> None:
    await register_and_verify(client)
    buyer = await bearer(client, BUYER["email"], BUYER["password"])

    admin = await bearer(client, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD)
    listed = await client.get("/api/v1/admin/users", headers=admin, params={"role": "buyer"})
    buyer_id = listed.json()["items"][0]["id"]

    removed = await client.delete(f"/api/v1/admin/users/{buyer_id}", headers=admin)
    assert removed.status_code == 204

    assert (await client.get("/api/v1/auth/me", headers=buyer)).status_code == 401
    assert (await client.get(f"/api/v1/admin/users/{buyer_id}", headers=admin)).status_code == 404

    remaining = await client.get("/api/v1/admin/users", headers=admin, params={"role": "buyer"})
    assert remaining.json()["total"] == 0

    assert (await client.post("/api/v1/auth/register", json=BUYER)).status_code == 409


async def test_suspension_revokes_access_immediately(
    client: AsyncClient, super_admin: None
) -> None:
    await register_and_verify(client)
    buyer = await bearer(client, BUYER["email"], BUYER["password"])

    admin = await bearer(client, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD)
    listed = await client.get("/api/v1/admin/users", headers=admin, params={"role": "buyer"})
    buyer_id = listed.json()["items"][0]["id"]

    suspended = await client.patch(
        f"/api/v1/admin/users/{buyer_id}", headers=admin, json={"status": "suspended"}
    )
    assert suspended.status_code == 200

    assert (await client.get("/api/v1/auth/me", headers=buyer)).status_code == 401

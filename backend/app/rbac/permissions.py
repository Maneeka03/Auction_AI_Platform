from collections.abc import Iterable
from enum import IntEnum, StrEnum


class Role(StrEnum):
    SUPER_ADMIN = "super_admin"
    AUCTION_MANAGER = "auction_manager"
    MARKETING = "marketing"
    LEGAL = "legal"
    FINANCE = "finance"
    GEMOLOGIST = "gemologist"
    BUYER = "buyer"
    SELLER = "seller"
    EXECUTIVE = "executive"
    # Sits above super admin: manages super-admin accounts and their sidebar, nothing operational.
    AGENCY_ADMIN = "agency_admin"


class Module(StrEnum):
    BUYER_CRM = "buyer_crm"
    SELLER_CRM = "seller_crm"
    LEAD_MANAGEMENT = "lead_management"
    ASSET_MANAGEMENT = "asset_management"
    AUCTION_MANAGEMENT = "auction_management"
    BID_MANAGEMENT = "bid_management"
    MARKETING_CAMPAIGNS = "marketing_campaigns"
    AI_CONFIGURATION = "ai_configuration"
    PAYMENT_ESCROW = "payment_escrow"
    REPORTS = "reports"
    SYSTEM_SETTINGS = "system_settings"
    USER_MANAGEMENT = "user_management"
    NOTIFICATIONS = "notifications"
    AGENCY_ADMINISTRATION = "agency_administration"


class Access(IntEnum):
    NONE = 0
    VIEW = 1
    FULL = 2


# Buyers and sellers self-register. Client confirmed (13 Jul): staff may NOT create these accounts.
SELF_SERVICE_ROLES = frozenset({Role.BUYER, Role.SELLER})

_COLUMNS = (
    Role.SUPER_ADMIN,
    Role.AUCTION_MANAGER,
    Role.MARKETING,
    Role.LEGAL,
    Role.FINANCE,
    Role.GEMOLOGIST,
    Role.BUYER,
    Role.SELLER,
    Role.EXECUTIVE,
    Role.AGENCY_ADMIN,
)

F, V, N = Access.FULL, Access.VIEW, Access.NONE

# Columns 1-3 and 7-9 are transcribed from "User Flow & Role Access Document" section 3.
# Columns 4-6 (legal, finance, gemologist) are PROVISIONAL: inferred from the client's 2-of-3
# auction approval quorum and awaiting sign-off. Column 10 (agency_admin) owns only agency
# administration and nothing operational. Every other column is client-confirmed.
# fmt: off
_ROWS: dict[Module, tuple[Access, ...]] = {
    Module.BUYER_CRM:             (F, F, V, N, N, N, N, N, V, N),
    Module.SELLER_CRM:            (F, F, N, V, V, N, N, V, V, N),
    Module.LEAD_MANAGEMENT:       (F, F, F, N, N, N, N, N, V, N),
    Module.ASSET_MANAGEMENT:      (F, F, V, V, V, V, V, F, V, N),
    Module.AUCTION_MANAGEMENT:    (F, F, N, V, V, V, V, V, V, N),
    Module.BID_MANAGEMENT:        (F, F, N, N, V, N, F, V, V, N),
    Module.MARKETING_CAMPAIGNS:   (F, V, F, N, N, N, N, N, V, N),
    Module.AI_CONFIGURATION:      (F, V, V, N, N, N, N, N, V, N),
    Module.PAYMENT_ESCROW:        (F, V, N, V, F, N, F, F, V, N),
    Module.REPORTS:               (F, F, V, V, V, N, V, V, F, N),
    Module.SYSTEM_SETTINGS:       (F, N, N, N, N, N, N, N, N, N),
    Module.USER_MANAGEMENT:       (F, V, N, N, N, N, N, N, N, N),
    Module.NOTIFICATIONS:         (F, F, F, F, F, F, F, F, F, N),
    Module.AGENCY_ADMINISTRATION: (N, N, N, N, N, N, N, N, N, F),
}
# fmt: on

MATRIX: dict[Role, dict[Module, Access]] = {
    role: {module: row[column] for module, row in _ROWS.items()}
    for column, role in enumerate(_COLUMNS)
}


def access_level(roles: Iterable[Role], module: Module) -> Access:
    return max((MATRIX[role][module] for role in roles), default=Access.NONE)


def can(roles: Iterable[Role], module: Module, required: Access) -> bool:
    return access_level(roles, module) >= required


def permissions_for(roles: Iterable[Role]) -> dict[str, str]:
    roles = list(roles)
    return {module.value: access_level(roles, module).name.lower() for module in Module}

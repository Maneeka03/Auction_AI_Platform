# from collections.abc import Iterable
# from enum import IntEnum, StrEnum


# class Role(StrEnum):
#     SUPER_ADMIN = "super_admin"
#     AUCTION_MANAGER = "auction_manager"
#     MARKETING = "marketing"
#     LEGAL = "legal"
#     FINANCE = "finance"
#     GEMOLOGIST = "gemologist"
#     BUYER = "buyer"
#     SELLER = "seller"
#     EXECUTIVE = "executive"
#     # Sits above super admin: manages super-admin accounts and their sidebar, nothing operational.
#     AGENCY_ADMIN = "agency_admin"
#     # Full operational access except system settings; fills Director seat like super_admin.
#     ADMIN = "admin"
#     LOW_LEVEL_ADMIN = "low_level_admin"


# class Module(StrEnum):
#     BUYER_CRM = "buyer_crm"
#     SELLER_CRM = "seller_crm"
#     LEAD_MANAGEMENT = "lead_management"
#     ASSET_MANAGEMENT = "asset_management"
#     AUCTION_MANAGEMENT = "auction_management"
#     BID_MANAGEMENT = "bid_management"
#     MARKETING_CAMPAIGNS = "marketing_campaigns"
#     AI_CONFIGURATION = "ai_configuration"
#     PAYMENT_ESCROW = "payment_escrow"
#     REPORTS = "reports"
#     SYSTEM_SETTINGS = "system_settings"
#     USER_MANAGEMENT = "user_management"
#     NOTIFICATIONS = "notifications"
#     AGENCY_ADMINISTRATION = "agency_administration"
    


# class Access(IntEnum):
#     NONE = 0
#     VIEW = 1
#     FULL = 2


# # Buyers and sellers self-register. Client confirmed (13 Jul): staff may NOT create these accounts.
# SELF_SERVICE_ROLES = frozenset({Role.BUYER, Role.SELLER})

# _COLUMNS = (
#     Role.SUPER_ADMIN,
#     Role.AUCTION_MANAGER,
#     Role.MARKETING,
#     Role.LEGAL,
#     Role.FINANCE,
#     Role.GEMOLOGIST,
#     Role.BUYER,
#     Role.SELLER,
#     Role.EXECUTIVE,
#     Role.AGENCY_ADMIN,
#     Role.ADMIN,
# )

# F, V, N = Access.FULL, Access.VIEW, Access.NONE

# # Columns 1-3 and 7-9 are transcribed from "User Flow & Role Access Document" section 3.
# # Columns 4-6 (legal, finance, gemologist) are PROVISIONAL: inferred from the client's 2-of-3
# # auction approval quorum and awaiting sign-off. Column 10 (agency_admin) owns only agency
# # administration and nothing operational. Every other column is client-confirmed.
# # Auction Manager (col 1): broad operational access; no approval seat (UI blocks votes),
# # no lead management, no AI configuration, and no user/KYC management.
# # Appraiser/Gemologist (col 5): identical permissions to Auction Manager; holds the "appraiser"
# # seat so they CAN approve/reject property listings on the Approvals page.
# # fmt: off
# _ROWS: dict[Module, tuple[Access, ...]] = {
#     Module.BUYER_CRM:             (F, F, V, N, N, F, N, N, V, N, F),
#     Module.SELLER_CRM:            (F, F, N, V, V, F, N, V, V, N, F),
#     Module.LEAD_MANAGEMENT:       (F, N, F, N, N, N, N, N, V, N, F),
#     Module.ASSET_MANAGEMENT:      (F, F, V, V, V, F, V, F, V, N, F),
#     Module.AUCTION_MANAGEMENT:    (F, F, N, V, V, F, V, V, V, N, F),
#     Module.BID_MANAGEMENT:        (F, F, N, N, V, F, F, V, V, N, F),
#     Module.MARKETING_CAMPAIGNS:   (F, F, F, N, N, F, N, N, V, N, F),
#     Module.AI_CONFIGURATION:      (F, N, V, N, N, N, N, N, V, N, F),
#     Module.PAYMENT_ESCROW:        (F, F, N, V, F, F, F, F, V, N, F),
#     Module.REPORTS:               (F, F, V, V, V, F, V, V, F, N, F),
#     Module.SYSTEM_SETTINGS:       (F, F, N, N, N, F, N, N, N, N, N),
#     Module.USER_MANAGEMENT:       (F, N, N, N, N, N, N, N, N, N, F),
#     Module.NOTIFICATIONS:         (F, F, F, F, F, F, F, F, F, N, F),
#     Module.AGENCY_ADMINISTRATION: (N, N, N, N, N, N, N, N, N, F, N),
# }
# # fmt: on

# MATRIX: dict[Role, dict[Module, Access]] = {
#     role: {module: row[column] for module, row in _ROWS.items()}
#     for column, role in enumerate(_COLUMNS)
# }


# def access_level(roles: Iterable[Role], module: Module) -> Access:
#     return max((MATRIX[role][module] for role in roles), default=Access.NONE)


# def can(roles: Iterable[Role], module: Module, required: Access) -> bool:
#     return access_level(roles, module) >= required


# def permissions_for(roles: Iterable[Role]) -> dict[str, str]:
#     roles = list(roles)
#     return {module.value: access_level(roles, module).name.lower() for module in Module}









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
    # Full operational access except system settings; fills Director seat like super_admin.
    ADMIN = "admin"
    # Added per the 13 Jul clarifications follow-up ("Sorry I forgot to ask for access right for
    # admins and auction managers"). A day-to-day operator: anonymized CRM + listings only, no
    # reports/notifications/system settings, no deletion rights.
    LOW_LEVEL_ADMIN = "low_level_admin"


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
    Role.ADMIN,
    Role.LOW_LEVEL_ADMIN,
)

F, V, N = Access.FULL, Access.VIEW, Access.NONE

# Columns 1-3 and 7-9 are transcribed from "User Flow & Role Access Document" section 3.
# Columns 4-6 (legal, finance, gemologist) are PROVISIONAL: inferred from the client's 2-of-3
# auction approval quorum and awaiting sign-off. Column 10 (agency_admin) owns only agency
# administration and nothing operational. Column 12 (low_level_admin) is transcribed verbatim
# from the 13 Jul clarifications follow-up: CRM (anonymized) + Listings only, everything else
# denied. Every other column is client-confirmed.
# Auction Manager (col 1): broad operational access; no approval seat (UI blocks votes),
# no lead management, no AI configuration, and no user/KYC management.
# Appraiser/Gemologist (col 5): identical permissions to Auction Manager; holds the "appraiser"
# seat so they CAN approve/reject property listings on the Approvals page.
# fmt: off
_ROWS: dict[Module, tuple[Access, ...]] = {
    Module.BUYER_CRM:             (F, F, V, N, N, F, N, N, V, N, F, F),
    Module.SELLER_CRM:            (F, F, N, V, V, F, N, V, V, N, F, F),
    Module.LEAD_MANAGEMENT:       (F, N, F, N, N, N, N, N, V, N, F, N),
    Module.ASSET_MANAGEMENT:      (F, F, V, V, V, F, V, F, V, N, F, F),
    Module.AUCTION_MANAGEMENT:    (F, F, N, V, V, F, V, V, V, N, F, N),
    Module.BID_MANAGEMENT:        (F, F, N, N, V, F, F, V, V, N, F, N),
    Module.MARKETING_CAMPAIGNS:   (F, F, F, N, N, F, N, N, V, N, F, N),
    Module.AI_CONFIGURATION:      (F, N, V, N, N, N, N, N, V, N, F, N),
    Module.PAYMENT_ESCROW:        (F, F, N, V, F, F, F, F, V, N, F, N),
    Module.REPORTS:               (F, F, V, V, V, F, V, V, F, N, F, N),
    Module.SYSTEM_SETTINGS:       (F, F, N, N, N, F, N, N, N, N, N, N),
    Module.USER_MANAGEMENT:       (F, N, N, N, N, N, N, N, N, N, F, N),
    Module.NOTIFICATIONS:         (F, F, F, F, F, F, F, F, F, N, F, N),
    Module.AGENCY_ADMINISTRATION: (N, N, N, N, N, N, N, N, N, F, N, N),
}
# fmt: on

MATRIX: dict[Role, dict[Module, Access]] = {
    role: {module: row[column] for module, row in _ROWS.items()}
    for column, role in enumerate(_COLUMNS)
}

# 13 Jul clarifications, section 1: "Senior Admin (formerly Super Admin) ... Has full access to
# the CRM (including non-anonymized user names)". Executive, Director, and Low-Level Admin all
# get CRM access with names anonymized. Only roles listed here see real buyer/seller identities.
UNANONYMIZED_CRM_ROLES = frozenset({Role.SUPER_ADMIN})


def access_level(roles: Iterable[Role], module: Module) -> Access:
    return max((MATRIX[role][module] for role in roles), default=Access.NONE)


def can(roles: Iterable[Role], module: Module, required: Access) -> bool:
    return access_level(roles, module) >= required


def can_view_unanonymized_crm(roles: Iterable[Role]) -> bool:
    """Whether this role set may see real buyer/seller names and emails in the CRM."""
    return not UNANONYMIZED_CRM_ROLES.isdisjoint(roles)


def permissions_for(roles: Iterable[Role]) -> dict[str, str]:
    roles = list(roles)
    return {module.value: access_level(roles, module).name.lower() for module in Module}

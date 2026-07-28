import { type NextRequest, NextResponse } from "next/server";

const STAFF_PATHS = ["/dashboard", "/listings", "/auctions", "/approvals", "/reports", "/marketing", "/admin", "/settings", "/agency", "/crm"];
const BUYER_PATHS = ["/properties", "/wallet", "/kyc", "/live-auctions", "/account"];
const AUTH_PATHS = new Set(["/login", "/signup", "/forgot-password", "/reset-password", "/set-password", "/verify-email"]);

// Top-level route segments that are real Next.js pages — not tenant slugs
const KNOWN_SEGMENTS = new Set([
  "dashboard", "listings", "auctions", "approvals", "reports", "marketing",
  "admin", "settings", "agency", "crm", "properties", "wallet", "kyc",
  "live-auctions", "account", "login", "signup", "forgot-password",
  "reset-password", "set-password", "verify-email", "api", "_next",
]);

function matchesPath(pathname: string, paths: string[]) {
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Tenant-slug detection ────────────────────────────────────────────────
  // Detect /{slug}/{page} where {slug} is not a known route segment.
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0] ?? "";

  if (firstSegment && !KNOWN_SEGMENTS.has(firstSegment) && /^[a-z0-9-]+$/.test(firstSegment)) {
    const tenantSlug = firstSegment;
    const effectivePath = segments.length > 1 ? `/${segments.slice(1).join("/")}` : "/login";
    const authHint = request.cookies.get("auth_hint")?.value;

    // Unauthenticated user accessing a protected page → redirect to tenant login
    if (!authHint && (matchesPath(effectivePath, STAFF_PATHS) || matchesPath(effectivePath, BUYER_PATHS))) {
      const url = request.nextUrl.clone();
      url.pathname = `/${tenantSlug}/login`;
      const res = NextResponse.redirect(url);
      res.cookies.set("tenant-slug", tenantSlug, { path: "/", sameSite: "lax", maxAge: 604800 });
      return res;
    }

    // Authenticated user visiting a tenant auth page → redirect to their home
    if (authHint && AUTH_PATHS.has(effectivePath)) {
      const url = request.nextUrl.clone();
      if (authHint === "agency") {
        url.pathname = "/agency/super-admins";
      } else if (authHint === "staff") {
        url.pathname = `/${tenantSlug}/dashboard`;
      } else {
        // Buyers always go to discovery page first
        url.pathname = "/";
      }
      const res = NextResponse.redirect(url);
      res.cookies.set("tenant-slug", tenantSlug, { path: "/", sameSite: "lax", maxAge: 604800 });
      return res;
    }

    // Rewrite /{slug}/{page} → /{page}, set tenant cookie
    const url = request.nextUrl.clone();
    url.pathname = effectivePath;
    const res = NextResponse.rewrite(url);
    res.cookies.set("tenant-slug", tenantSlug, { path: "/", sameSite: "lax", maxAge: 604800 });
    return res;
  }

  // ── Standard routing (no tenant prefix) ──────────────────────────────────
  const authHint = request.cookies.get("auth_hint")?.value;
  const tenantSlug = request.cookies.get("tenant-slug")?.value ?? null;

  if (!authHint && (matchesPath(pathname, STAFF_PATHS) || matchesPath(pathname, BUYER_PATHS))) {
    const url = request.nextUrl.clone();
    url.pathname = tenantSlug ? `/${tenantSlug}/login` : "/login";
    return NextResponse.redirect(url);
  }

  if (authHint && AUTH_PATHS.has(pathname)) {
    const url = request.nextUrl.clone();
    if (authHint === "agency") {
      url.pathname = "/agency/super-admins";
    } else if (authHint === "staff") {
      url.pathname = tenantSlug ? `/${tenantSlug}/dashboard` : "/dashboard";
    } else {
      // Buyers always go to discovery page first
      url.pathname = "/";
    }
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/set-password",
    "/verify-email",
    "/dashboard/:path*",
    "/listings/:path*",
    "/auctions/:path*",
    "/approvals/:path*",
    "/reports/:path*",
    "/marketing/:path*",
    "/admin/:path*",
    "/settings",
    "/settings/:path*",
    "/crm/:path*",
    "/account",
    "/account/:path*",
    "/properties/:path*",
    "/wallet/:path*",
    "/kyc/:path*",
    "/live-auctions/:path*",
    "/agency/:path*",
    // Tenant-slug prefixed paths: /:slug/:page+
    "/:slug/:path+",
  ],
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  "/",
  "/auth/login",
  "/auth/register",
  "/service/selling",
  "/service/buying",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith("/_next"))) {
    return NextResponse.next();
  }

  // Allow API routes and static files
  if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // For authenticated routes, the client-side layout handles the check
  // since access tokens are stored in memory (not cookies).
  // Middleware only provides a basic guard via refresh_token cookie presence.
  const refreshToken = request.cookies.get("refresh_token");
  if (!refreshToken && !PUBLIC_PATHS.some((p) => pathname === p)) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

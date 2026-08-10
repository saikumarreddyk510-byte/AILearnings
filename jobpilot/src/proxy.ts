import { NextResponse } from "next/server";
import { auth } from "@/server/auth/config";

/**
 * Next.js 16 renamed Middleware to Proxy (same mechanism, new file name).
 * This performs an *optimistic* check only — it reads the session from the
 * JWT cookie, never hits the database — per the Next.js authentication
 * guide's guidance that Proxy should pre-filter obviously unauthorized
 * requests, not be the sole authorization boundary. The real enforcement
 * lives in src/server/data/* (row-level ownership) and
 * src/server/auth/session.ts (requireUserId()).
 */
const PROTECTED_ROUTES = ["/dashboard"];
const AUTH_ONLY_ROUTES = ["/sign-in", "/register"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;

  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthOnly = AUTH_ONLY_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/sign-in", req.nextUrl));
  }

  if (isAuthOnly && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

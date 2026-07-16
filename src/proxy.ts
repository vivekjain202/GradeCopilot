import { NextResponse, type NextRequest } from "next/server";

import { sessionCookieName, verifySessionToken } from "@/lib/auth/token";

const requestWindows = new Map<string, { count: number; startedAt: number }>();
const windowMs = 60_000;
const maxRequestsPerWindow = 120;

export async function proxy(request: NextRequest) {
  const rateLimitKey =
    request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (isRateLimited(rateLimitKey)) {
    return new NextResponse("Too many requests. Please try again shortly.", {
      status: 429,
    });
  }

  const session = await verifySessionToken(
    request.cookies.get(sessionCookieName)?.value,
  );

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

function isRateLimited(key: string) {
  const now = Date.now();
  const current = requestWindows.get(key);
  if (!current || now - current.startedAt >= windowMs) {
    requestWindows.set(key, { count: 1, startedAt: now });
    return false;
  }

  current.count += 1;
  return current.count > maxRequestsPerWindow;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/students/:path*",
    "/tests/:path*",
    "/submissions/:path*",
    "/evaluations/:path*",
    "/reports/:path*",
  ],
};

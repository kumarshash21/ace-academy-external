import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token";

/**
 * Gate for every /api/postgres/* route (paths here are root-relative).
 *
 *  - /signup is public.
 *  - Everything else needs a valid session cookie.
 *  - Writes (non-GET) are admin-only, except learner progress/assessment
 *    submissions, whose handlers check the body's uid against the session.
 *  - /users (admin listing) is admin-only; /user/:uid and /user-progress/:uid
 *    reads are self-or-admin.
 */
const LEARNER_WRITES = new Set(["/api/postgres/user-progress", "/api/postgres/assessments/submit"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const path = pathname.replace(/\/+$/, "");

  if (path === "/api/postgres/signup") return NextResponse.next();

  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const isAdmin = session.role === "admin";
  const forbidden = () => NextResponse.json({ error: "Forbidden." }, { status: 403 });
  if (isAdmin) return NextResponse.next();

  const isRead = request.method === "GET" || request.method === "HEAD";
  if (!isRead) return LEARNER_WRITES.has(path) ? NextResponse.next() : forbidden();

  if (path === "/api/postgres/users") return forbidden();

  const selfScoped = path.match(/^\/api\/postgres\/(?:user|user-progress)\/([^/]+)$/);
  if (selfScoped && decodeURIComponent(selfScoped[1]) !== session.uid) return forbidden();

  return NextResponse.next();
}

export const config = {
  matcher: "/api/postgres/:path*",
};

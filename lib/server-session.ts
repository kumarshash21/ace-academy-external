import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_PATH,
  SESSION_MAX_AGE_SECONDS,
  signSessionToken,
  verifySessionToken,
  type SessionClaims,
} from "@/lib/session-token";

export async function getSessionUser(): Promise<SessionClaims | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export async function setSessionCookie(claims: SessionClaims): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, await signSessionToken(claims), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: SESSION_COOKIE_PATH,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: SESSION_COOKIE_PATH,
    maxAge: 0,
  });
}

/**
 * For routes that take a uid in the body: returns an error response unless the
 * caller is that user or an admin, otherwise null.
 */
export async function forbidUnlessSelfOrAdmin(uid: string | undefined): Promise<NextResponse | null> {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (session.role !== "admin" && session.uid !== uid) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  return null;
}

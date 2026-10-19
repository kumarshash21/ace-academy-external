/**
 * Edge-safe session token helpers (used by both route handlers and proxy.ts,
 * so nothing here may import next/headers).
 */
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "ace_session";
export const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;
export const SESSION_COOKIE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/ace_academy_external";

export type SessionClaims = {
  uid: string;
  email: string;
  name: string;
  team: string;
  role: "admin" | "learner";
  mustChangePassword: boolean;
};

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET is not set (needs at least 32 characters).");
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(claims: SessionClaims): Promise<string> {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.uid)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string | undefined): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string") return null;
    return {
      uid: payload.sub,
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
      team: String(payload.team ?? ""),
      role: payload.role === "admin" ? "admin" : "learner",
      mustChangePassword: payload.mustChangePassword === true,
    };
  } catch {
    return null;
  }
}

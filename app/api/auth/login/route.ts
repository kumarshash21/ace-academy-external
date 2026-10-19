import { NextResponse } from "next/server";
import { DataClientError, dataRequest } from "@/lib/data-client";
import { isGreyOrangeEmail, normalizeEmail } from "@/lib/email-validation";
import { setSessionCookie } from "@/lib/server-session";

type VerifyResponse = {
  user: { id: string; name: string; email: string; team: string; role: "admin" | "learner" };
  mustChangePassword: boolean;
};

/**
 * POST /api/auth/login  { email, password }
 *
 * Verifies against the backend's credential store, then issues the httpOnly
 * session cookie. The response carries the profile for the UI to render.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { email?: string; password?: string };
    const email = body.email ? normalizeEmail(body.email) : "";
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json({ error: "Please enter email and password." }, { status: 400 });
    }
    if (!isGreyOrangeEmail(email)) {
      return NextResponse.json(
        { error: "Please use your organization email only (@greyorange.com)." },
        { status: 400 }
      );
    }

    let verified: VerifyResponse;
    try {
      verified = await dataRequest<VerifyResponse>("/api/auth/verify", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    } catch (err) {
      if (err instanceof DataClientError && err.status === 401) {
        return NextResponse.json({ error: "Invalid credentials. Please check your email/password." }, { status: 401 });
      }
      if (err instanceof DataClientError && err.status === 429) {
        return NextResponse.json({ error: "Too many failed attempts. Please try again later." }, { status: 429 });
      }
      throw err;
    }

    const { user, mustChangePassword } = verified;
    await setSessionCookie({
      uid: user.id,
      email: user.email,
      name: user.name,
      team: user.team,
      role: user.role,
      mustChangePassword,
    });

    return NextResponse.json({ ok: true, user: { ...user, uid: user.id }, mustChangePassword });
  } catch (error) {
    console.error("[auth/login]", error);
    return NextResponse.json({ error: "Unable to sign in right now. Please try again." }, { status: 500 });
  }
}

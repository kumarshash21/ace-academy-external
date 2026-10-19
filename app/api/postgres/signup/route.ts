import { NextResponse } from "next/server";
import { createUserProfile } from "@/lib/create-user-profile";
import { DataClientError, dataRequest } from "@/lib/data-client";
import { isGreyOrangeEmail, normalizeEmail } from "@/lib/email-validation";

type SignupBody = {
  name?: string;
  email?: string;
  password?: string;
  team?: string;
};

/**
 * POST /api/postgres/signup  { name, email, password, team }
 *
 * Public self-signup: creates a learner profile, then stores the hashed
 * credential via the backend. Role and allowed level are decided server-side
 * (never from the request body).
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as SignupBody;
    const name = body.name?.trim();
    const team = body.team?.trim();
    const password = body.password ?? "";
    const email = body.email ? normalizeEmail(body.email) : "";

    if (!name || !email || !password || !team) {
      return NextResponse.json({ error: "name, email, password, and team are required." }, { status: 400 });
    }

    if (!isGreyOrangeEmail(email)) {
      return NextResponse.json(
        { error: "Please use a GreyOrange organization email (@greyorange.com)." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 });
    }

    let allowedLevel = 0;
    try {
      const policy = await dataRequest<{ data: { allowed_level: number } }>(
        `/api/team_policies/${encodeURIComponent(team)}`
      );
      allowedLevel = policy.data.allowed_level;
    } catch {
      // No policy for this team yet — default to 0.
    }

    const uid = crypto.randomUUID();

    try {
      await createUserProfile({ uid, name, email, team, role: "learner", allowedLevel, allowedLevelSource: "team" });
    } catch (err) {
      if (err instanceof DataClientError && err.status === 409) {
        return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
      }
      throw err;
    }

    await dataRequest("/api/auth/credentials", {
      method: "POST",
      body: JSON.stringify({ userId: uid, password, mustChangePassword: false }),
    });

    return NextResponse.json({ ok: true, uid }, { status: 201 });
  } catch (error) {
    console.error("[signup]", error);
    return NextResponse.json({ error: "Unable to create account. Please try again." }, { status: 500 });
  }
}

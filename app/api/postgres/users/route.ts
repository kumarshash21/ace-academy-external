import { NextResponse } from "next/server";
import { createUserProfile } from "@/lib/create-user-profile";
import { isGreyOrangeEmail, normalizeEmail } from "@/lib/email-validation";
import { dataRequest } from "@/lib/data-client";

type ExpandedUser = {
  uid: string;
  name: string;
  email: string;
  team: string;
  role: "admin" | "learner";
  certifications: unknown[];
  modulesCovered: number;
};

/**
 * GET /api/postgres/users
 *
 * Admin user-management listing. Returns every user with the fields the
 * Manage Program → User Management panel needs (the /rankings projection
 * omits email + role, so this is a dedicated admin view).
 */
export async function GET() {
  try {
    const { users } = await dataRequest<{ users: ExpandedUser[] }>("/api/users?expand=full");
    return NextResponse.json({ users });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

type CreateBody = {
  name?: string;
  email?: string;
  password?: string;
  team?: string;
  role?: "admin" | "learner";
};

/**
 * POST /api/postgres/users
 *
 * Admin-driven user creation: creates the profile, then stores the hashed
 * credential via the backend. The admin-chosen password is treated as temporary
 * (the user must change it on first sign-in).
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateBody;
    const name = body.name?.trim();
    const team = body.team?.trim();
    const role = body.role === "admin" ? "admin" : "learner";
    const password = body.password ?? "";
    const email = body.email ? normalizeEmail(body.email) : "";

    if (!name || !email || !password || !team) {
      return NextResponse.json(
        { error: "name, email, password, and team are required." },
        { status: 400 }
      );
    }

    if (!isGreyOrangeEmail(email)) {
      return NextResponse.json(
        { error: "Please use a GreyOrange organization email (@greyorange.com)." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    // Resolve the team's allowed level (matches the signup team-policy flow).
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

    await createUserProfile({ uid, name, email, team, role, allowedLevel, allowedLevelSource: "team" });
    await dataRequest("/api/auth/credentials", {
      method: "POST",
      body: JSON.stringify({ userId: uid, password, mustChangePassword: true }),
    });

    return NextResponse.json({ ok: true, uid }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

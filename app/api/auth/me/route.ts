import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server-session";

/** GET /api/auth/me — the signed-in user from the session cookie, or 401. */
export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  return NextResponse.json({
    user: {
      uid: session.uid,
      email: session.email,
      name: session.name,
      team: session.team,
      role: session.role,
    },
    mustChangePassword: session.mustChangePassword,
  });
}

import { NextResponse } from "next/server";
import { DataClientError, dataRequest } from "@/lib/data-client";
import { getSessionUser, setSessionCookie } from "@/lib/server-session";

/** POST /api/auth/change-password  { currentPassword, newPassword } */
export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { currentPassword?: string; newPassword?: string };
  if (!body.currentPassword || !body.newPassword) {
    return NextResponse.json({ error: "currentPassword and newPassword are required." }, { status: 400 });
  }

  try {
    await dataRequest("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({
        userId: session.uid,
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
      }),
    });
  } catch (err) {
    if (err instanceof DataClientError && (err.status === 400 || err.status === 401)) {
      const message = (err.body as { error?: string } | null)?.error ?? "Unable to change password.";
      return NextResponse.json({ error: message }, { status: err.status });
    }
    console.error("[auth/change-password]", err);
    return NextResponse.json({ error: "Unable to change password right now." }, { status: 500 });
  }

  await setSessionCookie({ ...session, mustChangePassword: false });
  return NextResponse.json({ ok: true });
}

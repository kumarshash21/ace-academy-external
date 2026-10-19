import { NextResponse } from "next/server";
import { DataClientError, dataRequest } from "@/lib/data-client";
import { getSessionUser } from "@/lib/server-session";

/** Admin-only: list pending password-reset requests. */
export async function GET() {
  const session = await getSessionUser();
  if (session?.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  try {
    return NextResponse.json(await dataRequest("/api/auth/reset-requests"));
  } catch (error) {
    console.error("[password-resets]", error);
    return NextResponse.json({ error: "Unable to load reset requests." }, { status: 500 });
  }
}

/** Admin-only: POST { id, password } sets a temporary password and closes the request. */
export async function POST(request: Request) {
  const session = await getSessionUser();
  if (session?.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as { id?: string; password?: string };
  if (!body.id || !body.password) {
    return NextResponse.json({ error: "id and password are required." }, { status: 400 });
  }
  try {
    await dataRequest(`/api/auth/reset-requests/${encodeURIComponent(body.id)}/resolve`, {
      method: "POST",
      body: JSON.stringify({ password: body.password }),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof DataClientError && (error.status === 400 || error.status === 404)) {
      const message = (error.body as { error?: string } | null)?.error ?? "Unable to reset password.";
      return NextResponse.json({ error: message }, { status: error.status });
    }
    console.error("[password-resets]", error);
    return NextResponse.json({ error: "Unable to reset password." }, { status: 500 });
  }
}

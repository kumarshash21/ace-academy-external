import { NextResponse } from "next/server";
import { DataClientError, dataRequest } from "@/lib/data-client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;

    if (!uid) {
      return NextResponse.json({ error: "uid is required." }, { status: 400 });
    }

    try {
      const profile = await dataRequest(`/api/users/${encodeURIComponent(uid)}/profile`);
      return NextResponse.json(profile);
    } catch (backendError) {
      if (backendError instanceof DataClientError && backendError.status === 404) {
        return NextResponse.json({ error: "User profile not found." }, { status: 404 });
      }
      throw backendError;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

type PatchBody = {
  name?: string;
  role?: "admin" | "learner";
  team?: string;
};

/**
 * PATCH /api/postgres/user/[uid]
 *
 * Admin edit of a user's identity/access fields (name, role, team).
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;

    if (!uid) {
      return NextResponse.json({ error: "uid is required." }, { status: 400 });
    }

    const body = (await request.json()) as PatchBody;

    const hasValidField =
      (typeof body.name === "string" && body.name.trim()) ||
      body.role === "admin" ||
      body.role === "learner" ||
      (typeof body.team === "string" && body.team.trim());

    if (!hasValidField) {
      return NextResponse.json(
        { error: "No valid fields to update (name, role, or team)." },
        { status: 400 }
      );
    }

    await dataRequest(`/api/users/${encodeURIComponent(uid)}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });

    return NextResponse.json({ ok: true, uid });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/postgres/user/[uid]
 *
 * Removes the user's profile.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;

    if (!uid) {
      return NextResponse.json({ error: "uid is required." }, { status: 400 });
    }

    await dataRequest(`/api/users/${encodeURIComponent(uid)}`, { method: "DELETE" });

    return NextResponse.json({ ok: true, uid });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

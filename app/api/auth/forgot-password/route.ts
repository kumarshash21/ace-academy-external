import { NextResponse } from "next/server";
import { dataRequest } from "@/lib/data-client";
import { isGreyOrangeEmail, normalizeEmail } from "@/lib/email-validation";

/**
 * POST /api/auth/forgot-password  { email }
 *
 * Public. Files a reset request for an admin to action. The response is the
 * same whether or not the email is registered.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const email = body.email ? normalizeEmail(body.email) : "";
  if (!email || !isGreyOrangeEmail(email)) {
    return NextResponse.json({ error: "Please enter your @greyorange.com email." }, { status: 400 });
  }
  try {
    await dataRequest("/api/auth/reset-requests", { method: "POST", body: JSON.stringify({ email }) });
  } catch (error) {
    console.error("[auth/forgot-password]", error);
    return NextResponse.json({ error: "Unable to submit your request right now. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

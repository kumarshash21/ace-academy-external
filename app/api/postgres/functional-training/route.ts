import { NextRequest, NextResponse } from "next/server";
import { dataRequest } from "@/lib/data-client";

/**
 * GET /api/postgres/functional-training?topicId=<id>
 *
 * Lists functional training modules, optionally filtered by topic.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get("topicId");

    const query = topicId ? `?topic_id=${encodeURIComponent(topicId)}` : "";
    const result = await dataRequest(`/api/functional_trainings${query}`);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

type CreateBody = {
  topicId?: number | string;
  title?: string;
  link?: string;
  sortOrder?: number;
};

/**
 * POST /api/postgres/functional-training
 *
 * Admin-created training module, body: { topicId, title, link, sortOrder? }.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateBody;

    if (!body.topicId || !body.title?.trim() || !body.link?.trim()) {
      return NextResponse.json(
        { error: "topicId, title, and link are required." },
        { status: 400 }
      );
    }

    const result = await dataRequest("/api/functional_trainings", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

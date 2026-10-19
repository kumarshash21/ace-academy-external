import { NextResponse } from "next/server";
import { DataClientError, dataRequest } from "@/lib/data-client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Syllabus id is required." }, { status: 400 });
    }

    try {
      const syllabus = await dataRequest(`/api/courses/${encodeURIComponent(id)}/syllabus`);
      return NextResponse.json(syllabus);
    } catch (backendError) {
      if (backendError instanceof DataClientError && backendError.status === 404) {
        return NextResponse.json({ error: "Syllabus not found." }, { status: 404 });
      }
      throw backendError;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

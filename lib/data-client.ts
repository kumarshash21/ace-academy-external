/**
 * Single seam between the app's route handlers (app/api/**) and whatever
 * database/backend replaces the old Postgres service.
 *
 * Forwards each call to the Express backend (Ace_Academy_backend) at
 * BACKEND_API_URL, authenticating with the shared INTERNAL_API_KEY header.
 * Server-side only — the key must never reach the browser.
 */

/** Thrown when the data layer fails; `status` mirrors an HTTP status. */
export class DataClientError extends Error {
  constructor(public readonly status: number, public readonly body: unknown = null) {
    super(`Data layer responded ${status}`);
    this.name = "DataClientError";
  }
}

export async function dataRequest<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const baseUrl = process.env.BACKEND_API_URL;
  const apiKey = process.env.INTERNAL_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new DataClientError(501, { error: "Data layer not configured (BACKEND_API_URL / INTERNAL_API_KEY)." });
  }

  const headers = new Headers(init.headers);
  headers.set("x-internal-key", apiKey);
  if (init.body !== undefined && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  let res: Response;
  try {
    res = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, { ...init, headers, cache: "no-store" });
  } catch {
    throw new DataClientError(502, { error: "Backend unreachable." });
  }

  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  if (!res.ok) throw new DataClientError(res.status, body);
  return body as T;
}

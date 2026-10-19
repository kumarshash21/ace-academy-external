/**
 * Single seam between the app's route handlers (app/api/**) and whatever
 * database/backend replaces the old Postgres service.
 *
 * Currently NOT connected to anything: every call throws DataClientError(501).
 * To plug in a new DB, implement `dataRequest` below (keep the same
 * path/init contract, or rewrite call sites). Server-side only.
 */

/** Thrown when the data layer fails; `status` mirrors an HTTP status. */
export class DataClientError extends Error {
  constructor(public readonly status: number, public readonly body: unknown = null) {
    super(`Data layer responded ${status}`);
    this.name = "DataClientError";
  }
}

export async function dataRequest<T = unknown>(_path: string, _init: RequestInit = {}): Promise<T> {
  throw new DataClientError(501, { error: "Data layer not configured." });
}

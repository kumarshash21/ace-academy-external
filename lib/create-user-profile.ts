import { dataRequest } from "@/lib/data-client";

export type CreateUserProfileInput = {
  uid: string;
  name: string;
  email: string;
  team: string;
  role: "admin" | "learner";
  allowedLevel: number;
  allowedLevelSource?: string;
};

/**
 * Creates a user's profile record via the data layer. Does not create credentials.
 */
export async function createUserProfile(input: CreateUserProfileInput): Promise<void> {
  const { uid, name, email, team, role, allowedLevel } = input;
  const allowedLevelSource = input.allowedLevelSource ?? "team";

  await dataRequest(`/api/users`, {
    method: "POST",
    body: JSON.stringify({ id: uid, name, email, team, role, allowedLevel, allowedLevelSource }),
  });
}

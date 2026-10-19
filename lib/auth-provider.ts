/**
 * Client-side auth seam. Replace the body of these functions with the in-app
 * auth implementation (e.g. calls to your own /api/auth/* endpoints).
 *
 * Current implementation is a LOCAL-ONLY placeholder backed by the hardcoded
 * users in lib/auth.ts (SEED_USERS). Edit that list to add or change users. It is not secure and must not ship to production.
 */
import { SEED_USERS, type User } from "@/lib/auth";

export type AuthResult = { ok: true; user: User } | { ok: false; error: string };

export const authProvider = {
  async login(email: string, password: string): Promise<AuthResult> {
    const user = SEED_USERS.find(
      (candidate) => candidate.email.toLowerCase() === email && candidate.password === password
    );
    if (!user) return { ok: false, error: "Incorrect email or password. Please try again." };
    return { ok: true, user };
  },

  async signup(_input: { name: string; email: string; password: string; team: string }): Promise<{ ok: false; error: string }> {
    return { ok: false, error: "Sign-up is not available yet." };
  },

  async logout(): Promise<void> {},
};

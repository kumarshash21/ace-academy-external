/**
 * Client-side auth seam. Talks to the cookie-session routes under /api/auth/*.
 * (The live login screen is the legacy index.html, which calls the same routes.)
 */
import type { User } from "@/lib/auth";
import { apiUrl } from "@/lib/api";

export type AuthResult = { ok: true; user: User } | { ok: false; error: string };

type LoginResponse = {
  user?: { uid: string; name: string; email: string; team: string; role: "admin" | "learner" };
  error?: string;
};

export const authProvider = {
  async login(email: string, password: string): Promise<AuthResult> {
    try {
      const res = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as LoginResponse;
      if (!res.ok || !data.user) {
        return { ok: false, error: data.error ?? "Incorrect email or password. Please try again." };
      }
      const { uid, name, email: userEmail, team, role } = data.user;
      const av = name.split(/\s+/).filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "LN";
      return { ok: true, user: { id: uid, name, email: userEmail, password: "", team, role, av } };
    } catch {
      return { ok: false, error: "Unable to reach the server. Please try again." };
    }
  },

  async signup(input: { name: string; email: string; password: string; team: string }): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
      const res = await fetch(apiUrl("/api/postgres/signup"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) return { ok: false, error: data.error ?? "Unable to create account. Please try again." };
      return { ok: true };
    } catch {
      return { ok: false, error: "Unable to reach the server. Please try again." };
    }
  },

  async logout(): Promise<void> {
    try {
      await fetch(apiUrl("/api/auth/logout"), { method: "POST" });
    } catch {
      // Cookie expires on its own.
    }
  },
};

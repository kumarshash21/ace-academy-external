"use client";

import { useEffect, useState } from "react";
import { authProvider } from "@/lib/auth-provider";
import { getUsersFromStorage, type User } from "@/lib/auth";
import { greyOrangeEmailErrorMessage, isGreyOrangeEmail, normalizeEmail } from "@/lib/email-validation";
import { getCurrentLevelFromCerts } from "@/lib/certifications";
import { apiUrl } from "@/lib/api";

type LoginResult = {
  ok: boolean;
  error?: string;
};

type UserProfile = {
  uid?: string;
  name?: string;
  email?: string;
  team?: string;
  role?: "admin" | "learner";
  level?: number;
  allowedLevel?: number;
  allowedLevelSource?: string;
  certifications?: Array<{
    module_name?: string;
    levels?: Array<{
      level_name?: string;
      status?: string;
      score?: number;
      attemptedTime?: number;
      noOfAttempts?: number;
      lastAttemptDate?: string | null;
      completedAt?: string | null;
    }>;
  }> | Array<{
    level_name?: string;
    status?: string;
    completedAt?: string | null;
    modules?: Array<{
      name?: string;
      status?: string;
      score?: number;
      noOfAttempts?: number;
      lastAttemptDate?: string | null;
    }>;
  }> | string[];
};

function toUser(email: string, profile?: UserProfile & { uid: string }, base?: User): User {
  const displayName = profile?.name?.trim() || base?.name || email.split("@")[0] || "Learner";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "LN";

  let certifications: any[] = base?.certifications as any[] ?? [];
  let computedLevel = 0;

  if (Array.isArray(profile?.certifications)) {
    certifications = profile.certifications;
    computedLevel = getCurrentLevelFromCerts(profile.certifications as any[]);
  }

  return {
    id: profile?.uid ?? base?.id ?? "",
    name: displayName,
    email: profile?.email ?? base?.email ?? email,
    password: "",
    role: profile?.role ?? base?.role ?? "learner",
    team: profile?.team ?? base?.team ?? "TAC",
    av: initials,
    level: computedLevel || (typeof profile?.level === "number" ? profile.level : base?.level ?? 0),
    allowedLevel: typeof profile?.allowedLevel === "number" ? profile.allowedLevel : base?.allowedLevel ?? 0,
    allowedLevelSource: profile?.allowedLevelSource,
    certifications,
  };
}

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Seed users to localStorage on first load to preserve legacy behavior.
    getUsersFromStorage();
    setIsReady(true);
  }, []);

  async function login(email: string, password: string): Promise<LoginResult> {
    const normalizedEmail = normalizeEmail(email);

    if (!isGreyOrangeEmail(normalizedEmail)) {
      return { ok: false, error: greyOrangeEmailErrorMessage() };
    }

    const result = await authProvider.login(normalizedEmail, password);
    if (!result.ok) return { ok: false, error: result.error };

    // Hydrate from the data layer when available; otherwise keep the auth user as-is.
    let user = result.user;
    try {
      const profileResponse = await fetch(apiUrl(`/api/postgres/user/${user.id}`));
      if (profileResponse.ok) {
        const profile = (await profileResponse.json()) as UserProfile & { uid: string };
        user = toUser(normalizedEmail, profile, user);
      }
    } catch (_profileError) {
      // Ignore profile fetch failures and use the auth user.
    }

    setCurrentUser(user);
    return { ok: true };
  }

  async function logout() {
    await authProvider.logout();

    setCurrentUser(null);
  }

  return {
    currentUser,
    isReady,
    login,
    logout,
  };
}

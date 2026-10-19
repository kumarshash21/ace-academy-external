import type { CertificationModule } from "@/lib/certifications";

export type UserRole = "admin" | "learner";

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  team: string;
  av: string;
  level?: number;
  allowedLevel?: number;
  allowedLevelSource?: string;
  certifications?: CertificationModule[] | string[];
};

export function sanitizeUser(user: User): Omit<User, "password"> {
  const { password: _password, ...rest } = user;
  return rest;
}

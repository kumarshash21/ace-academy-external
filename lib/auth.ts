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

const USERS_STORAGE_KEY = "ace3_users";

export const SEED_USERS: User[] = [
  {
    id: "u001",
    name: "Admin User",
    email: "admin@greyorange.com",
    password: "admin123",
    role: "admin",
    team: "TAC",
    av: "AU",
  },
  {
    id: "u002",
    name: "Kumar",
    email: "kumar@greyorange.com",
    password: "kumar123",
    role: "learner",
    team: "TAC",
    av: "K",
  },
  {
    id: "u003",
    name: "Bharat",
    email: "bharat@greyorange.com",
    password: "bharat123",
    role: "learner",
    team: "TAC",
    av: "B",
  },
  {
    id: "u004",
    name: "Vivek",
    email: "vivek@greyorange.com",
    password: "vivek123",
    role: "learner",
    team: "TAC",
    av: "V",
  },
];

export function getUsersFromStorage(): User[] {
  const stored = window.localStorage.getItem(USERS_STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored) as User[];
  }
  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(SEED_USERS));
  return JSON.parse(JSON.stringify(SEED_USERS)) as User[];
}

export function sanitizeUser(user: User): Omit<User, "password"> {
  const { password: _password, ...rest } = user;
  return rest;
}

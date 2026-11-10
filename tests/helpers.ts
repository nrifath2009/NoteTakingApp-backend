import bcrypt from "bcryptjs";
import type { Express } from "express";
import request from "supertest";
import { User } from "../src/modules/users/user.model.js";
import type { UserRole } from "../src/modules/users/user.schema.js";

export function bearer(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function createAccount(
  app: Express,
  options: {
    role?: UserRole;
    email?: string;
    password?: string;
    name?: string;
    interests?: string[];
  } = {},
) {
  const password = options.password ?? "Password1";
  const email =
    options.email ?? `user-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
  const user = await User.create({
    name: options.name ?? "Test User",
    email,
    passwordHash: await bcrypt.hash(password, 10),
    role: options.role ?? "user",
    interests: options.interests ?? [],
  });
  const response = await request(app).post("/api/auth/login").send({ email, password });
  if (response.status !== 200) {
    throw new Error(`Login failed: ${response.status} ${JSON.stringify(response.body)}`);
  }
  return { user, email, password, token: response.body.data.accessToken as string };
}

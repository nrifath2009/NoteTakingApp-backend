import type { Express } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { env } from "../src/config/env.js";
import { User } from "../src/modules/users/user.model.js";
import { bearer, createAccount } from "./helpers.js";

let app: Express;

beforeAll(() => {
  app = createApp();
});

describe("authentication", () => {
  it("registers a user, ignores role, and normalizes email and interests", async () => {
    const response = await request(app).post("/api/auth/register").send({
      name: "Ada",
      email: "Ada@Example.com",
      password: "Password1",
      role: "admin",
      interests: ["Reading", "reading", "Chess"],
    });

    expect(response.status).toBe(201);
    expect(response.body.data.role).toBe("user");
    expect(response.body.data.email).toBe("ada@example.com");
    expect(response.body.data.interests).toEqual(["reading", "chess"]);
    expect(response.body.data.passwordHash).toBeUndefined();
    expect(response.body.data.accessToken).toBeUndefined();

    const stored = await User.findOne({ email: "ada@example.com" }).select("+passwordHash");
    expect(stored?.passwordHash).toBeTruthy();
    expect(stored?.passwordHash).not.toBe("Password1");
    expect(stored?.passwordHash.startsWith("$2")).toBe(true);
    expect(await bcrypt.compare("Password1", stored!.passwordHash)).toBe(true);
  });

  it("rejects a duplicate email and a weak password", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Ada",
      email: "ada@example.com",
      password: "Password1",
    });
    const duplicate = await request(app).post("/api/auth/register").send({
      name: "Ada",
      email: "ADA@example.com",
      password: "Password1",
    });
    expect(duplicate.status).toBe(409);

    const weak = await request(app).post("/api/auth/register").send({
      name: "Ada",
      email: "other@example.com",
      password: "short",
    });
    expect(weak.status).toBe(400);
    expect(weak.body.success).toBe(false);
    expect(Array.isArray(weak.body.errors)).toBe(true);
  });

  it("logs in and puts only the user id in sub", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Ada",
      email: "ada@example.com",
      password: "Password1",
    });
    const response = await request(app).post("/api/auth/login").send({
      email: "ada@example.com",
      password: "Password1",
    });

    expect(response.status).toBe(200);
    expect(response.body.data.tokenType).toBe("Bearer");
    expect(response.body.data.user.passwordHash).toBeUndefined();

    const decoded = jwt.verify(response.body.data.accessToken, env.jwtSecret, {
      algorithms: ["HS256"],
      issuer: env.jwtIssuer,
      audience: env.jwtAudience,
    });
    expect(typeof decoded).not.toBe("string");
    if (typeof decoded === "string") return;
    expect(decoded.sub).toBe(response.body.data.user.id);
    expect(decoded).not.toHaveProperty("role");
    expect(decoded.iss).toBe(env.jwtIssuer);
    expect(decoded.aud).toBe(env.jwtAudience);
  });

  it("uses the same message for a bad password and an unknown email", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Ada",
      email: "ada@example.com",
      password: "Password1",
    });
    const badPassword = await request(app).post("/api/auth/login").send({
      email: "ada@example.com",
      password: "Password2",
    });
    const unknown = await request(app).post("/api/auth/login").send({
      email: "missing@example.com",
      password: "Password1",
    });
    expect(badPassword.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(badPassword.body.message).toBe(unknown.body.message);
  });

  it("rejects missing, invalid, expired, and wrong-audience tokens", async () => {
    const { user, token } = await createAccount(app);
    const me = await request(app).get("/api/auth/me").set(bearer(token));
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe(user.email);

    expect((await request(app).get("/api/auth/me")).status).toBe(401);
    expect(
      (await request(app).get("/api/auth/me").set({ Authorization: "Bearer not-a-token" })).status,
    ).toBe(401);

    const expired = jwt.sign({ sub: user.id }, env.jwtSecret, {
      algorithm: "HS256",
      expiresIn: -10,
      issuer: env.jwtIssuer,
      audience: env.jwtAudience,
    });
    expect((await request(app).get("/api/auth/me").set(bearer(expired))).status).toBe(401);

    const wrongAudience = jwt.sign({ sub: user.id }, env.jwtSecret, {
      algorithm: "HS256",
      expiresIn: "15m",
      issuer: env.jwtIssuer,
      audience: "someone-else",
    });
    expect((await request(app).get("/api/auth/me").set(bearer(wrongAudience))).status).toBe(401);
  });

  it("forbids a regular user from admin routes", async () => {
    const { token } = await createAccount(app);
    const response = await request(app).get("/api/admin/users").set(bearer(token));
    expect(response.status).toBe(403);
  });

  it("changes the password when the current password matches", async () => {
    const { email, token } = await createAccount(app, { password: "Password1" });

    const changed = await request(app)
      .post("/api/auth/change-password")
      .set(bearer(token))
      .send({ currentPassword: "Password1", newPassword: "Password2" });
    expect(changed.status).toBe(200);
    expect(changed.body.data.passwordHash).toBeUndefined();

    const oldLogin = await request(app).post("/api/auth/login").send({
      email,
      password: "Password1",
    });
    const newLogin = await request(app).post("/api/auth/login").send({
      email,
      password: "Password2",
    });
    expect(oldLogin.status).toBe(401);
    expect(newLogin.status).toBe(200);

    const stored = await User.findOne({ email }).select("+passwordHash");
    expect(await bcrypt.compare("Password2", stored!.passwordHash)).toBe(true);
  });

  it("rejects a wrong, weak, or unchanged password", async () => {
    const { token } = await createAccount(app, { password: "Password1" });

    expect((await request(app).post("/api/auth/change-password").send({
      currentPassword: "Password1",
      newPassword: "Password2",
    })).status).toBe(401);

    const wrong = await request(app)
      .post("/api/auth/change-password")
      .set(bearer(token))
      .send({ currentPassword: "Password9", newPassword: "Password2" });
    expect(wrong.status).toBe(400);
    expect(wrong.body.message).toBe("Current password is incorrect");

    const weak = await request(app)
      .post("/api/auth/change-password")
      .set(bearer(token))
      .send({ currentPassword: "Password1", newPassword: "short" });
    expect(weak.status).toBe(400);

    const same = await request(app)
      .post("/api/auth/change-password")
      .set(bearer(token))
      .send({ currentPassword: "Password1", newPassword: "Password1" });
    expect(same.status).toBe(400);
  });

  it("updates the signed-in profile and does not change role", async () => {
    const account = await createAccount(app, { email: "profile@example.com", password: "Password1" });
    await createAccount(app, { email: "taken@example.com" });

    const updated = await request(app).put("/api/auth/me").set(bearer(account.token)).send({
      name: "Profile Name",
      email: "renamed@example.com",
      interests: ["Chess", "chess"],
      role: "admin",
    });
    expect(updated.status).toBe(200);
    expect(updated.body.data).toMatchObject({
      name: "Profile Name",
      email: "renamed@example.com",
      role: "user",
      interests: ["chess"],
    });
    expect(updated.body.data.passwordHash).toBeUndefined();

    const duplicate = await request(app).put("/api/auth/me").set(bearer(account.token)).send({
      name: "Profile Name",
      email: "taken@example.com",
      interests: [],
    });
    expect(duplicate.status).toBe(409);

    expect((await request(app).put("/api/auth/me").send({
      name: "Profile Name",
      email: "renamed@example.com",
      interests: [],
    })).status).toBe(401);
  });

  it("answers the health check", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("ok");
  });
});

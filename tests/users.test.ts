import type { Express } from "express";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { Note } from "../src/modules/notes/note.model.js";
import { Post } from "../src/modules/posts/post.model.js";
import { User } from "../src/modules/users/user.model.js";
import { seedAdmin } from "../src/modules/users/user.service.js";
import { bearer, createAccount } from "./helpers.js";

let app: Express;

beforeAll(() => {
  app = createApp();
});

describe("admin users", () => {
  it("blocks non-admins and creates, lists, and updates users", async () => {
    const user = await createAccount(app, { email: "user@example.com" });
    const admin = await createAccount(app, { role: "admin", email: "admin@example.com" });

    expect((await request(app).get("/api/admin/users").set(bearer(user.token))).status).toBe(403);

    const created = await request(app).post("/api/admin/users").set(bearer(admin.token)).send({
      name: "New Person",
      email: "new@example.com",
      password: "Password1",
      role: "user",
      interests: ["Chess"],
    });
    expect(created.status).toBe(201);
    expect(created.body.data.role).toBe("user");
    expect(created.body.data.interests).toEqual(["chess"]);
    expect(created.body.data.passwordHash).toBeUndefined();

    const stored = await User.findById(created.body.data.id).select("+passwordHash");
    const hashBefore = stored?.passwordHash;
    expect(hashBefore?.startsWith("$2")).toBe(true);

    const list = await request(app).get("/api/admin/users?limit=1").set(bearer(admin.token));
    expect(list.status).toBe(200);
    expect(list.body.pagination.limit).toBe(1);
    expect(list.body.pagination.total).toBe(3);

    const fetched = await request(app)
      .get(`/api/admin/users/${created.body.data.id}`)
      .set(bearer(admin.token));
    expect(fetched.status).toBe(200);

    const missing = await request(app)
      .get(`/api/admin/users/${new User()._id.toString()}`)
      .set(bearer(admin.token));
    expect(missing.status).toBe(404);

    const updated = await request(app)
      .put(`/api/admin/users/${created.body.data.id}`)
      .set(bearer(admin.token))
      .send({ name: "Renamed", interests: ["reading"] });
    expect(updated.status).toBe(200);
    expect(updated.body.data.name).toBe("Renamed");

    const hashAfter = (await User.findById(created.body.data.id).select("+passwordHash"))?.passwordHash;
    expect(hashAfter).toBe(hashBefore);

    const duplicate = await request(app)
      .put(`/api/admin/users/${created.body.data.id}`)
      .set(bearer(admin.token))
      .send({ email: "user@example.com" });
    expect(duplicate.status).toBe(409);
  });

  it("refuses to delete or demote the last administrator", async () => {
    const admin = await createAccount(app, { role: "admin", email: "solo@example.com" });

    const demote = await request(app)
      .put(`/api/admin/users/${admin.user.id}`)
      .set(bearer(admin.token))
      .send({ role: "user" });
    expect(demote.status).toBe(409);
    expect((await User.findById(admin.user.id))?.role).toBe("admin");

    const remove = await request(app).delete(`/api/admin/users/${admin.user.id}`).set(bearer(admin.token));
    expect(remove.status).toBe(409);
    expect(await User.findById(admin.user.id)).toBeTruthy();
  });

  it("deletes a non-admin and that user's notes and posts", async () => {
    const admin = await createAccount(app, { role: "admin", email: "admin@example.com" });
    const member = await createAccount(app, { email: "member@example.com" });
    await Note.create({ userId: member.user._id, title: "n", content: "c" });
    await Post.create({ userId: member.user._id, title: "p", content: "c" });

    const secondAdmin = await createAccount(app, { role: "admin", email: "admin2@example.com" });
    const removed = await request(app)
      .delete(`/api/admin/users/${member.user.id}`)
      .set(bearer(secondAdmin.token));
    expect(removed.status).toBe(200);
    expect(await User.findById(member.user.id)).toBeNull();
    expect(await Note.countDocuments({ userId: member.user._id })).toBe(0);
    expect(await Post.countDocuments({ userId: member.user._id })).toBe(0);

    const me = await request(app).get("/api/auth/me").set(bearer(member.token));
    expect(me.status).toBe(401);
    expect(admin.user.role).toBe("admin");
  });

  it("seeds an admin once and does not reset the password", async () => {
    const first = await seedAdmin("seed@example.com", "ChangeThisPassword123!");
    const stored = await User.findOne({ email: "seed@example.com" }).select("+passwordHash");
    const hash = stored?.passwordHash;
    const second = await seedAdmin("seed@example.com", "AnotherPassword123!");
    const again = await User.findOne({ email: "seed@example.com" }).select("+passwordHash");

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(again?.passwordHash).toBe(hash);
    expect(again?.role).toBe("admin");
  });
});

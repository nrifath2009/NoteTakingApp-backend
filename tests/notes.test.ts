import type { Express } from "express";
import mongoose from "mongoose";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { Note } from "../src/modules/notes/note.model.js";
import { bearer, createAccount } from "./helpers.js";

let app: Express;

beforeAll(() => {
  app = createApp();
});

async function createNote(token: string, title: string, content = "body") {
  return request(app).post("/api/notes").set(bearer(token)).send({ title, content });
}

describe("notes authorization and pagination", () => {
  it("keeps ownership on the caller and hides other users' notes", async () => {
    const owner = await createAccount(app, { email: "owner@example.com" });
    const other = await createAccount(app, { email: "other@example.com" });
    const created = await request(app).post("/api/notes").set(bearer(owner.token)).send({
      title: "Secret",
      content: "Mine",
      userId: other.user.id,
    });

    expect(created.status).toBe(201);
    expect(created.body.data.userId).toBe(owner.user.id);

    const foreignGet = await request(app).get(`/api/notes/${created.body.data.id}`).set(bearer(other.token));
    const foreignUpdate = await request(app)
      .put(`/api/notes/${created.body.data.id}`)
      .set(bearer(other.token))
      .send({ title: "Hacked" });
    const foreignDelete = await request(app)
      .delete(`/api/notes/${created.body.data.id}`)
      .set(bearer(other.token));

    expect(foreignGet.status).toBe(404);
    expect(foreignUpdate.status).toBe(404);
    expect(foreignDelete.status).toBe(404);

    const stillThere = await request(app).get(`/api/notes/${created.body.data.id}`).set(bearer(owner.token));
    expect(stillThere.status).toBe(200);
    expect(stillThere.body.data.title).toBe("Secret");
  });

  it("lets an admin read any note but not change or delete it", async () => {
    const owner = await createAccount(app, { email: "owner@example.com" });
    const admin = await createAccount(app, { role: "admin", email: "admin@example.com" });
    const created = await createNote(owner.token, "Visible", "Original");
    const id = created.body.data.id as string;

    expect((await request(app).get("/api/admin/notes").set(bearer(owner.token))).status).toBe(403);

    const adminList = await request(app).get("/api/admin/notes").set(bearer(admin.token));
    expect(adminList.status).toBe(200);
    expect(adminList.body.data.map((note: { id: string }) => note.id)).toContain(id);

    const adminGet = await request(app).get(`/api/notes/${id}`).set(bearer(admin.token));
    expect(adminGet.status).toBe(200);

    const adminOwnList = await request(app).get("/api/notes").set(bearer(admin.token));
    expect(adminOwnList.body.data).toEqual([]);

    expect(
      (await request(app).put(`/api/notes/${id}`).set(bearer(admin.token)).send({ content: "Changed" }))
        .status,
    ).toBe(404);
    expect((await request(app).delete(`/api/notes/${id}`).set(bearer(admin.token))).status).toBe(404);

    const stored = await Note.findById(id);
    expect(stored?.content).toBe("Original");
  });

  it("updates and deletes only the owner's note", async () => {
    const owner = await createAccount(app);
    const created = await createNote(owner.token, "Draft", "v1");
    const id = created.body.data.id as string;

    const updated = await request(app).put(`/api/notes/${id}`).set(bearer(owner.token)).send({ content: "v2" });
    expect(updated.status).toBe(200);
    expect(updated.body.data.content).toBe("v2");

    const removed = await request(app).delete(`/api/notes/${id}`).set(bearer(owner.token));
    expect(removed.status).toBe(200);
    expect((await request(app).get(`/api/notes/${id}`).set(bearer(owner.token))).status).toBe(404);
  });

  it("paginates with defaults, custom pages, and stable ordering", async () => {
    const owner = await createAccount(app);
    const empty = await request(app).get("/api/notes").set(bearer(owner.token));
    expect(empty.body.pagination).toEqual({ page: 1, limit: 10, total: 0, totalPages: 0 });

    for (let index = 1; index <= 5; index += 1) {
      const response = await createNote(owner.token, `Note ${index}`);
      expect(response.status).toBe(201);
    }

    const defaults = await request(app).get("/api/notes").set(bearer(owner.token));
    expect(defaults.body.pagination).toMatchObject({ page: 1, limit: 10, total: 5, totalPages: 1 });
    expect(defaults.body.data).toHaveLength(5);
    expect(defaults.body.data[0].title).toBe("Note 5");

    const page = await request(app).get("/api/notes?page=2&limit=2").set(bearer(owner.token));
    expect(page.status).toBe(200);
    expect(page.body.data).toHaveLength(2);
    expect(page.body.pagination).toEqual({ page: 2, limit: 2, total: 5, totalPages: 3 });

    for (const query of ["page=0", "page=-1", "limit=0", "limit=101", "page=abc"]) {
      const invalid = await request(app).get(`/api/notes?${query}`).set(bearer(owner.token));
      expect(invalid.status).toBe(400);
    }
  });

  it("breaks timestamp ties by _id descending", async () => {
    const owner = await createAccount(app);
    const createdAt = new Date("2024-01-01T00:00:00.000Z");
    const first = new mongoose.Types.ObjectId();
    const second = new mongoose.Types.ObjectId();
    await Note.collection.insertMany([
      {
        _id: first,
        userId: owner.user._id,
        title: "first",
        content: "a",
        createdAt,
        updatedAt: createdAt,
      },
      {
        _id: second,
        userId: owner.user._id,
        title: "second",
        content: "b",
        createdAt,
        updatedAt: createdAt,
      },
    ]);

    const response = await request(app).get("/api/notes").set(bearer(owner.token));
    expect(response.body.data.map((note: { title: string }) => note.title)).toEqual(["second", "first"]);
  });
});

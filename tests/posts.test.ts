import type { Express } from "express";
import type { PipelineStage } from "mongoose";
import request from "supertest";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { User } from "../src/modules/users/user.model.js";
import { bearer, createAccount } from "./helpers.js";

let app: Express;

beforeAll(() => {
  app = createApp();
});

describe("posts", () => {
  it("lists public posts and loads one user's posts with a single $lookup", async () => {
    const author = await createAccount(app, { name: "Author", email: "author@example.com" });
    const reader = await createAccount(app, { email: "reader@example.com" });
    const other = await createAccount(app, { email: "other@example.com" });

    await request(app).post("/api/posts").set(bearer(other.token)).send({ title: "Other", content: "nope" });
    for (const title of ["One", "Two", "Three"]) {
      const created = await request(app).post("/api/posts").set(bearer(author.token)).send({
        title,
        content: title,
      });
      expect(created.status).toBe(201);
      expect(created.body.data.userId).toBe(author.user.id);
    }

    const all = await request(app).get("/api/posts?limit=10").set(bearer(reader.token));
    expect(all.status).toBe(200);
    expect(all.body.pagination.total).toBe(4);

    const spy = vi.spyOn(User, "aggregate");
    const page = await request(app)
      .get(`/api/users/${author.user.id}/posts?page=1&limit=2`)
      .set(bearer(reader.token));

    expect(page.status).toBe(200);
    expect(page.body.data.user).toEqual({ id: author.user.id, name: "Author" });
    expect(page.body.data.posts).toHaveLength(2);
    expect(page.body.data.posts.every((post: { userId: string }) => post.userId === author.user.id)).toBe(
      true,
    );
    expect(page.body.data.posts.map((post: { title: string }) => post.title)).toEqual(["Three", "Two"]);
    expect(page.body.pagination).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });
    expect(spy).toHaveBeenCalledTimes(1);
    const pipeline = spy.mock.calls[0]?.[0] as PipelineStage[];
    expect(pipeline.some((stage) => "$lookup" in stage && stage.$lookup.from === "posts")).toBe(true);
    spy.mockRestore();

    const second = await request(app)
      .get(`/api/users/${author.user.id}/posts?page=2&limit=2`)
      .set(bearer(reader.token));
    expect(second.body.data.posts.map((post: { title: string }) => post.title)).toEqual(["One"]);

    const empty = await request(app).get(`/api/users/${reader.user.id}/posts`).set(bearer(reader.token));
    expect(empty.status).toBe(200);
    expect(empty.body.data.posts).toEqual([]);
    expect(empty.body.pagination.total).toBe(0);

    const missing = await request(app)
      .get(`/api/users/${new User()._id.toString()}/posts`)
      .set(bearer(reader.token));
    expect(missing.status).toBe(404);
  });
});

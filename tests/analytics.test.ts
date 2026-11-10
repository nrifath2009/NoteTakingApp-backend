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

describe("interest analytics", () => {
  it("counts each user once per interest and paginates inside one aggregation", async () => {
    const admin = await createAccount(app, {
      role: "admin",
      email: "admin@example.com",
      interests: ["chess", "reading"],
    });
    const user = await createAccount(app, { email: "user@example.com" });
    expect((await request(app).get("/api/admin/analytics/interests").set(bearer(user.token))).status).toBe(
      403,
    );

    await User.collection.insertOne({
      name: "Dup",
      email: "dup@example.com",
      passwordHash: "not-used",
      role: "user",
      interests: ["reading", "reading"],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await User.collection.insertOne({
      name: "Empty",
      email: "empty@example.com",
      passwordHash: "not-used",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await User.create({
      name: "Yoga",
      email: "yoga@example.com",
      passwordHash: "not-used",
      role: "user",
      interests: ["yoga"],
    });

    const spy = vi.spyOn(User, "aggregate");
    const response = await request(app)
      .get("/api/admin/analytics/interests?page=1&limit=2")
      .set(bearer(admin.token));

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([
      { _id: "reading", userCount: 2 },
      { _id: "chess", userCount: 1 },
    ]);
    expect(response.body.pagination).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });

    const page2 = await request(app)
      .get("/api/admin/analytics/interests?page=2&limit=2")
      .set(bearer(admin.token));
    expect(page2.body.data).toEqual([{ _id: "yoga", userCount: 1 }]);

    expect(spy).toHaveBeenCalledTimes(2);
    const pipeline = spy.mock.calls[0]?.[0] as PipelineStage[];
    expect(pipeline.map((stage) => Object.keys(stage)[0])).toEqual([
      "$project",
      "$unwind",
      "$group",
      "$sort",
      "$facet",
    ]);
    expect(JSON.stringify(pipeline)).toContain("$setUnion");
    spy.mockRestore();
  });

  it("returns an empty page when nobody has interests", async () => {
    const admin = await createAccount(app, { role: "admin", email: "admin@example.com" });
    const response = await request(app).get("/api/admin/analytics/interests").set(bearer(admin.token));
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
    expect(response.body.pagination).toEqual({ page: 1, limit: 10, total: 0, totalPages: 0 });
  });
});

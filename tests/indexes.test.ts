import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import { noteSchema, Note } from "../src/modules/notes/note.model.js";
import { postSchema, Post } from "../src/modules/posts/post.model.js";
import { userSchema, User } from "../src/modules/users/user.model.js";
import { buildUserPostsPipeline } from "../src/modules/posts/post.service.js";
import { containsIxscan, lookupUsesIndex } from "../src/utils/explain-plan.js";

function indexKeys(schema: mongoose.Schema): Record<string, number>[] {
  return schema.indexes().map(([keys]) => keys as Record<string, number>);
}

describe("index declarations and execution plans", () => {
  it("declares only the query indexes", () => {
    expect(indexKeys(userSchema)).toEqual([{ email: 1 }, { createdAt: -1, _id: -1 }]);
    expect(userSchema.indexes().find(([keys]) => "email" in keys)?.[1]).toMatchObject({ unique: true });
    expect(indexKeys(noteSchema)).toEqual([
      { userId: 1, createdAt: -1, _id: -1 },
      { createdAt: -1, _id: -1 },
    ]);
    expect(indexKeys(postSchema)).toEqual([
      { userId: 1, createdAt: -1, _id: -1 },
      { createdAt: -1, _id: -1 },
    ]);

    const serialized = JSON.stringify([
      ...indexKeys(userSchema),
      ...indexKeys(noteSchema),
      ...indexKeys(postSchema),
    ]);
    expect(serialized).not.toContain("interests");
    expect(serialized).not.toContain("title");
    expect(serialized).not.toContain("content");
    expect(serialized).not.toContain("name");
  });

  it("uses an index scan for note, post, and lookup queries", async () => {
    const owner = await User.create({
      name: "Owner",
      email: "owner@example.com",
      passwordHash: "hash",
      role: "user",
      interests: ["reading"],
    });
    const now = new Date();
    await Note.create(
      Array.from({ length: 20 }, (_, index) => ({
        userId: owner._id,
        title: `n${index}`,
        content: "c",
        createdAt: new Date(now.getTime() + index * 1000),
      })),
    );
    await Post.create(
      Array.from({ length: 20 }, (_, index) => ({
        userId: owner._id,
        title: `p${index}`,
        content: "c",
        createdAt: new Date(now.getTime() + index * 1000),
      })),
    );
    await Promise.all([User.createIndexes(), Note.createIndexes(), Post.createIndexes()]);

    const userId = owner._id;

    const ownNotes = await Note.find({ userId })
      .sort({ createdAt: -1, _id: -1 })
      .limit(10)
      .explain("executionStats");
    const allNotes = await Note.find({})
      .sort({ createdAt: -1, _id: -1 })
      .limit(10)
      .explain("executionStats");
    const allPosts = await Post.find({})
      .sort({ createdAt: -1, _id: -1 })
      .limit(10)
      .explain("executionStats");
    const lookup = await User.aggregate(buildUserPostsPipeline(userId.toString(), 0, 10)).explain(
      "executionStats",
    );

    expect(containsIxscan(ownNotes)).toBe(true);
    expect(containsIxscan(allNotes)).toBe(true);
    expect(containsIxscan(allPosts)).toBe(true);
    expect(lookupUsesIndex(lookup, "userId_1_createdAt_-1__id_-1")).toBe(true);
  });
});

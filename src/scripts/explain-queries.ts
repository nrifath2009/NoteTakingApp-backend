import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { Note } from "../modules/notes/note.model.js";
import { Post } from "../modules/posts/post.model.js";
import { buildUserPostsPipeline } from "../modules/posts/post.service.js";
import { User } from "../modules/users/user.model.js";
import { buildInterestPipeline } from "../modules/users/user.service.js";
import { containsIxscan, lookupUsesIndex } from "../utils/explain-plan.js";

function summarize(label: string, plan: unknown, expectIndex: boolean) {
  const record = plan as {
    executionStats?: {
      totalKeysExamined?: number;
      totalDocsExamined?: number;
      executionTimeMillis?: number;
    };
  };
  const stats = record.executionStats;
  const ixscan =
    containsIxscan(plan) || lookupUsesIndex(plan, "userId_1_createdAt_-1__id_-1");
  console.log(
    JSON.stringify({
      label,
      ixscan,
      totalKeysExamined: stats?.totalKeysExamined,
      totalDocsExamined: stats?.totalDocsExamined,
      executionTimeMillis: stats?.executionTimeMillis,
      expectIndex,
    }),
  );
  if (expectIndex && !ixscan) {
    console.error(`${label} did not use an index scan`);
    process.exitCode = 1;
  }
}

try {
  await connectDatabase();
  await Promise.all([User.createIndexes(), Note.createIndexes(), Post.createIndexes()]);

  const user = await User.findOne();
  const userId = user?._id ?? new mongoose.Types.ObjectId();

  summarize(
    "notes-by-user",
    await Note.find({ userId }).sort({ createdAt: -1, _id: -1 }).limit(10).explain("executionStats"),
    true,
  );
  summarize(
    "notes-all",
    await Note.find().sort({ createdAt: -1, _id: -1 }).limit(10).explain("executionStats"),
    true,
  );
  summarize(
    "posts-all",
    await Post.find().sort({ createdAt: -1, _id: -1 }).limit(10).explain("executionStats"),
    true,
  );
  summarize(
    "posts-by-user-lookup",
    await User.aggregate(buildUserPostsPipeline(userId.toString(), 0, 10)).explain("executionStats"),
    true,
  );
  summarize("interests-grouping", await User.aggregate(buildInterestPipeline(0, 10)).explain("executionStats"), false);
  console.log("Interest grouping is a full collection aggregation and does not use an interests index.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}

import mongoose, { type PipelineStage } from "mongoose";
import { User } from "../users/user.model.js";
import { Post, type PostModelDocument } from "./post.model.js";
import { AppError } from "../../utils/app-error.js";
import { LIST_SORT, paginationMeta } from "../../utils/pagination.js";
import { API_MESSAGES, MONGO_NAMES } from "../../constants.js";

export type PublicPost = {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

type RawPost = {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

type LookupFacet = {
  data: RawPost[];
  metadata: { total: number }[];
};

type UserPostsAggregate = {
  _id: mongoose.Types.ObjectId;
  name: string;
  posts: LookupFacet[];
};

export function toPublicPost(post: PostModelDocument | RawPost): PublicPost {
  const id = "id" in post && typeof post.id === "string" ? post.id : post._id.toString();
  return {
    id,
    userId: post.userId.toString(),
    title: post.title,
    content: post.content,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

export async function createPost(
  userId: string,
  input: { title: string; content: string },
): Promise<PublicPost> {
  const post = await Post.create({ userId, title: input.title, content: input.content });
  return toPublicPost(post);
}

export async function listPosts(page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [posts, total] = await Promise.all([
    Post.find().sort(LIST_SORT).skip(skip).limit(limit),
    Post.countDocuments(),
  ]);
  return { posts: posts.map(toPublicPost), pagination: paginationMeta(page, limit, total) };
}

export function buildUserPostsPipeline(userId: string, skip: number, limit: number): PipelineStage[] {
  return [
    { $match: { _id: new mongoose.Types.ObjectId(userId) } },
    {
      $lookup: {
        from: MONGO_NAMES.POSTS_COLLECTION,
        localField: "_id",
        foreignField: "userId",
        pipeline: [
          { $sort: { createdAt: -1, _id: -1 } },
          {
            $facet: {
              data: [{ $skip: skip }, { $limit: limit }],
              metadata: [{ $count: "total" }],
            },
          },
        ],
        as: "posts",
      },
    },
    { $project: { name: 1, posts: 1 } },
  ];
}

/** One aggregation starting from users, with $lookup into posts. */
export async function listPostsForUser(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const result = await User.aggregate<UserPostsAggregate>(
    buildUserPostsPipeline(userId, skip, limit),
  );
  const doc = result[0];
  if (!doc) throw new AppError(API_MESSAGES.RESOURCE_NOT_FOUND, 404);

  const bucket = doc.posts[0];
  const rows = bucket?.data ?? [];
  const metadata = bucket?.metadata ?? [];
  const total = metadata[0]?.total ?? 0;

  return {
    user: { id: doc._id.toString(), name: doc.name },
    posts: rows.map(toPublicPost),
    pagination: paginationMeta(page, limit, total),
  };
}

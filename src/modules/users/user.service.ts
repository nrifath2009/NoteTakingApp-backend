import bcrypt from "bcryptjs";
import type { PipelineStage } from "mongoose";
import { Note } from "../notes/note.model.js";
import { Post } from "../posts/post.model.js";
import type { UserRole } from "./user.schema.js";
import { User, type UserModelDocument } from "./user.model.js";
import { AppError } from "../../utils/app-error.js";
import { LIST_SORT, paginationMeta } from "../../utils/pagination.js";

const BCRYPT_COST = 10;

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  interests: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type InterestGroup = {
  _id: string;
  userCount: number;
};

type InterestFacet = {
  data: InterestGroup[];
  metadata: { total: number }[];
};

export function toPublicUser(user: UserModelDocument): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    interests: user.interests,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  interests?: string[];
}): Promise<PublicUser> {
  const existing = await User.findOne({ email: input.email });
  if (existing) throw new AppError("Email already registered", 409);

  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash: await hashPassword(input.password),
    role: input.role,
    interests: input.interests ?? [],
  });
  return toPublicUser(user);
}

export async function listUsers(page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find().sort(LIST_SORT).skip(skip).limit(limit),
    User.countDocuments(),
  ]);
  return {
    users: users.map(toPublicUser),
    pagination: paginationMeta(page, limit, total),
  };
}

export async function getUser(id: string): Promise<PublicUser> {
  const user = await User.findById(id);
  if (!user) throw new AppError("Resource not found", 404);
  return toPublicUser(user);
}

async function assertNotLastAdmin(): Promise<void> {
  const adminCount = await User.countDocuments({ role: "admin" });
  if (adminCount <= 1) {
    throw new AppError("Cannot remove the last administrator", 409);
  }
}

export async function updateUser(
  id: string,
  input: { name?: string; email?: string; role?: UserRole; interests?: string[] },
): Promise<PublicUser> {
  const user = await User.findById(id);
  if (!user) throw new AppError("Resource not found", 404);

  if (input.role && user.role === "admin" && input.role !== "admin") {
    await assertNotLastAdmin();
  }

  if (input.email && input.email !== user.email) {
    const clash = await User.findOne({ email: input.email });
    if (clash) throw new AppError("Email already registered", 409);
  }

  if (input.name !== undefined) user.name = input.name;
  if (input.email !== undefined) user.email = input.email;
  if (input.role !== undefined) user.role = input.role;
  if (input.interests !== undefined) user.interests = input.interests;
  await user.save();
  return toPublicUser(user);
}

export async function deleteUser(id: string): Promise<{ id: string }> {
  const user = await User.findById(id);
  if (!user) throw new AppError("Resource not found", 404);
  if (user.role === "admin") await assertNotLastAdmin();

  await Note.deleteMany({ userId: user._id });
  await Post.deleteMany({ userId: user._id });
  await user.deleteOne();
  return { id: user.id };
}

export async function seedAdmin(email: string, password: string): Promise<{ created: boolean }> {
  const normalized = email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalized });
  if (existing) return { created: false };

  await User.create({
    name: "Administrator",
    email: normalized,
    passwordHash: await hashPassword(password),
    role: "admin",
    interests: [],
  });
  return { created: true };
}

export function buildInterestPipeline(skip: number, limit: number): PipelineStage[] {
  return [
    {
      $project: {
        interests: {
          $setUnion: [{ $ifNull: ["$interests", []] }, []],
        },
      },
    },
    { $unwind: "$interests" },
    {
      $group: {
        _id: "$interests",
        userCount: { $sum: 1 },
      },
    },
    { $sort: { userCount: -1, _id: 1 } },
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        metadata: [{ $count: "total" }],
      },
    },
  ];
}

/** One aggregation. Pagination metadata comes from $facet in the same call. */
export async function groupUsersByInterest(page: number, limit: number) {
  const skip = (page - 1) * limit;
  const result = await User.aggregate<InterestFacet>(buildInterestPipeline(skip, limit));
  const facet = result[0];
  const data = facet?.data ?? [];
  const metadata = facet?.metadata ?? [];
  const total = metadata[0]?.total ?? 0;
  return { data, pagination: paginationMeta(page, limit, total) };
}

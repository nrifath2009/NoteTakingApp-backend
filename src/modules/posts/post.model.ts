import mongoose, { type HydratedDocument } from "mongoose";
import { MONGO_NAMES } from "../../constants.js";

export interface PostDocument {
  userId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new mongoose.Schema<PostDocument>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: MONGO_NAMES.USER_MODEL, required: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
  },
  { timestamps: true },
);

// $lookup equality on userId plus user-scoped sort and pagination.
postSchema.index({ userId: 1, createdAt: -1, _id: -1 });

// Public post list sorted by createdAt/_id with no user filter.
postSchema.index({ createdAt: -1, _id: -1 });

export const Post = mongoose.model<PostDocument>("Post", postSchema);
export type PostModelDocument = HydratedDocument<PostDocument>;
export { postSchema };

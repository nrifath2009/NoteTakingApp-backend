import mongoose, { type HydratedDocument } from "mongoose";
import { USER_ROLES, type UserRole } from "./user.schema.js";

export interface UserDocument {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  interests: string[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, required: true, default: "user" },
    interests: { type: [String], default: [] },
  },
  { timestamps: true },
);

// Login lookup and unique email constraint.
userSchema.index({ email: 1 }, { unique: true });

// Admin user list sorted by createdAt desc, _id desc.
userSchema.index({ createdAt: -1, _id: -1 });

export const User = mongoose.model<UserDocument>("User", userSchema);
export type UserModelDocument = HydratedDocument<UserDocument>;
export { userSchema };

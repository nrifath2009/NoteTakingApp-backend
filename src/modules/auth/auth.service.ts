import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { requireUser } from "../../middleware/authenticate.js";
import { User } from "../users/user.model.js";
import { createUser, hashPassword, toPublicUser, updateUser, type PublicUser } from "../users/user.service.js";
import { AppError } from "../../utils/app-error.js";

export async function register(input: {
  name: string;
  email: string;
  password: string;
  interests?: string[];
}): Promise<PublicUser> {
  return createUser({
    name: input.name,
    email: input.email,
    password: input.password,
    role: "user",
    interests: input.interests,
  });
}

export async function login(email: string, password: string) {
  const user = await User.findOne({ email }).select("+passwordHash");
  const matches = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !matches) {
    throw new AppError("Invalid email or password", 401);
  }

  const accessToken = jwt.sign({ sub: user.id }, env.jwtSecret, {
    algorithm: "HS256",
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
  });

  return {
    accessToken,
    tokenType: "Bearer" as const,
    expiresIn: env.jwtExpiresIn,
    user: toPublicUser(user),
  };
}

export function currentUser(req: Express.Request): PublicUser {
  return requireUser(req);
}

export function updateProfile(
  userId: string,
  input: { name: string; email: string; interests: string[] },
): Promise<PublicUser> {
  return updateUser(userId, input);
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await User.findById(userId).select("+passwordHash");
  if (!user) throw new AppError("User no longer exists", 401);

  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) throw new AppError("Current password is incorrect", 400);

  user.passwordHash = await hashPassword(newPassword);
  await user.save();
}

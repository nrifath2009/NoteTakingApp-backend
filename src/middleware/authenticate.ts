import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../modules/users/user.model.js";
import type { AuthUser } from "../types/express.js";
import { AppError } from "../utils/app-error.js";

const OBJECT_ID = /^[a-fA-F0-9]{24}$/;

export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new AppError("Authentication required", 401);
    }

    const token = header.slice("Bearer ".length).trim();
    if (!token) throw new AppError("Authentication required", 401);

    let sub: string;
    try {
      const decoded = jwt.verify(token, env.jwtSecret, {
        algorithms: ["HS256"],
        issuer: env.jwtIssuer,
        audience: env.jwtAudience,
      });
      if (typeof decoded === "string" || typeof decoded.sub !== "string") {
        throw new Error("Invalid token payload");
      }
      sub = decoded.sub;
    } catch {
      throw new AppError("Invalid or expired token", 401);
    }

    if (!OBJECT_ID.test(sub)) {
      throw new AppError("Invalid or expired token", 401);
    }

    const user = await User.findById(sub);
    if (!user) throw new AppError("User no longer exists", 401);

    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      interests: user.interests,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    req.user = authUser;
    next();
  } catch (error) {
    next(error);
  }
};

export function requireUser(req: Express.Request): AuthUser {
  if (!req.user) throw new AppError("Authentication required", 401);
  return req.user;
}

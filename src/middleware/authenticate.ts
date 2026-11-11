import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../modules/users/user.model.js";
import type { AuthUser } from "../types/express.js";
import { AppError } from "../utils/app-error.js";
import { API_MESSAGES, AUTH_CONFIG } from "../constants.js";

const OBJECT_ID = /^[a-fA-F0-9]{24}$/;
const BEARER_PREFIX = `${AUTH_CONFIG.TOKEN_TYPE} `;

export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith(BEARER_PREFIX)) {
      throw new AppError(API_MESSAGES.AUTHENTICATION_REQUIRED, 401);
    }

    const token = header.slice(BEARER_PREFIX.length).trim();
    if (!token) throw new AppError(API_MESSAGES.AUTHENTICATION_REQUIRED, 401);

    let sub: string;
    try {
      const decoded = jwt.verify(token, env.jwtSecret, {
        algorithms: [AUTH_CONFIG.JWT_ALGORITHM],
        issuer: env.jwtIssuer,
        audience: env.jwtAudience,
      });
      if (typeof decoded === "string" || typeof decoded.sub !== "string") {
        throw new Error(API_MESSAGES.INVALID_TOKEN_PAYLOAD);
      }
      sub = decoded.sub;
    } catch {
      throw new AppError(API_MESSAGES.INVALID_TOKEN, 401);
    }

    if (!OBJECT_ID.test(sub)) {
      throw new AppError(API_MESSAGES.INVALID_TOKEN, 401);
    }

    const user = await User.findById(sub);
    if (!user) throw new AppError(API_MESSAGES.USER_NO_LONGER_EXISTS, 401);

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
  if (!req.user) throw new AppError(API_MESSAGES.AUTHENTICATION_REQUIRED, 401);
  return req.user;
}

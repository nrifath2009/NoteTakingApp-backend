import type { RequestHandler } from "express";
import type { UserRole } from "../modules/users/user.schema.js";
import { AppError } from "../utils/app-error.js";
import { API_MESSAGES } from "../constants.js";

export function authorize(...roles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(new AppError(API_MESSAGES.AUTHENTICATION_REQUIRED, 401));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new AppError(API_MESSAGES.FORBIDDEN, 403));
      return;
    }
    next();
  };
}

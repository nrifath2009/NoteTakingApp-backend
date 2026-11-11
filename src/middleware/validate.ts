import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { AppError } from "../utils/app-error.js";
import { API_MESSAGES } from "../constants.js";

export function validate(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      next(
        new AppError(
          API_MESSAGES.VALIDATION_ERROR,
          400,
          result.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        ),
      );
      return;
    }

    req.validated = result.data as {
      body: unknown;
      params: unknown;
      query: unknown;
    };
    next();
  };
}

export function validated<T>(req: Express.Request): T {
  if (!req.validated) {
    throw new AppError(API_MESSAGES.VALIDATION_ERROR, 400);
  }
  return req.validated as T;
}

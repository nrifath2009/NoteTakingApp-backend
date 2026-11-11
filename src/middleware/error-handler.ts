import type { ErrorRequestHandler } from "express";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";
import { API_MESSAGES, NODE_ENV } from "../constants.js";

function isDuplicateKey(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000
  );
}

function safeDevMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : API_MESSAGES.INTERNAL_SERVER_ERROR;
  if (message.includes(env.jwtSecret)) return API_MESSAGES.INTERNAL_SERVER_ERROR;
  return message;
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ success: false, message: API_MESSAGES.INVALID_ID, errors: [] });
    return;
  }

  if (isDuplicateKey(err)) {
    res.status(409).json({
      success: false,
      message: API_MESSAGES.EMAIL_ALREADY_REGISTERED,
      errors: [],
    });
    return;
  }

  if (err instanceof SyntaxError && "status" in err && (err as { status?: number }).status === 400) {
    res.status(400).json({ success: false, message: API_MESSAGES.INVALID_JSON, errors: [] });
    return;
  }

  console.error(err);
  res.status(500).json({
    success: false,
    message:
      env.nodeEnv === NODE_ENV.PRODUCTION ? API_MESSAGES.INTERNAL_SERVER_ERROR : safeDevMessage(err),
    errors: [],
  });
};

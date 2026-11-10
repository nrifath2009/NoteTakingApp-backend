import type { ErrorRequestHandler } from "express";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

function isDuplicateKey(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000
  );
}

function safeDevMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "Internal server error";
  if (message.includes(env.jwtSecret)) return "Internal server error";
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
    res.status(400).json({ success: false, message: "Invalid id", errors: [] });
    return;
  }

  if (isDuplicateKey(err)) {
    res.status(409).json({
      success: false,
      message: "Email already registered",
      errors: [],
    });
    return;
  }

  if (err instanceof SyntaxError && "status" in err && (err as { status?: number }).status === 400) {
    res.status(400).json({ success: false, message: "Invalid JSON", errors: [] });
    return;
  }

  console.error(err);
  res.status(500).json({
    success: false,
    message: env.nodeEnv === "production" ? "Internal server error" : safeDevMessage(err),
    errors: [],
  });
};

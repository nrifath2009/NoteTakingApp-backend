import type { RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { API_MESSAGES, NODE_ENV } from "../constants.js";

const jsonMessage = {
  success: false,
  message: API_MESSAGES.TOO_MANY_REQUESTS,
  errors: [] as [],
};

function limiter(limit: number, windowMs: number): RequestHandler {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.nodeEnv === NODE_ENV.TEST,
    message: jsonMessage,
  });
}

export const authRateLimit = limiter(20, 15 * 60 * 1000);
export const apiRateLimit = limiter(300, 60 * 1000);

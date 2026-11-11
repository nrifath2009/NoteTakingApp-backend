import dotenv from "dotenv";
import { z } from "zod";
import { emailSchema, passwordSchema } from "../modules/users/user.schema.js";
import { API_MESSAGES, DEFAULT_CONFIG, NODE_ENV } from "../constants.js";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(DEFAULT_CONFIG.PORT),
  NODE_ENV: z.enum([NODE_ENV.DEVELOPMENT, NODE_ENV.TEST, NODE_ENV.PRODUCTION]).default(NODE_ENV.DEVELOPMENT),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_ISSUER: z.string().min(1),
  JWT_AUDIENCE: z.string().min(1),
  JWT_EXPIRES_IN: z.string().min(1).default(DEFAULT_CONFIG.JWT_EXPIRES_IN),
  ADMIN_EMAIL: emailSchema,
  ADMIN_PASSWORD: passwordSchema,
  FRONTEND_URL: z.string().url().default(DEFAULT_CONFIG.FRONTEND_URL),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`${API_MESSAGES.INVALID_ENVIRONMENT_CONFIG}\n${details}`);
}

export const env = {
  port: parsed.data.PORT,
  nodeEnv: parsed.data.NODE_ENV,
  mongodbUri: parsed.data.MONGODB_URI,
  jwtSecret: parsed.data.JWT_SECRET,
  jwtIssuer: parsed.data.JWT_ISSUER,
  jwtAudience: parsed.data.JWT_AUDIENCE,
  jwtExpiresIn: parsed.data.JWT_EXPIRES_IN,
  adminEmail: parsed.data.ADMIN_EMAIL,
  adminPassword: parsed.data.ADMIN_PASSWORD,
  frontendUrl: parsed.data.FRONTEND_URL,
};

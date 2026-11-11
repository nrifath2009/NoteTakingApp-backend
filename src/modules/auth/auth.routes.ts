import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authRateLimit } from "../../middleware/rate-limit.js";
import { validate } from "../../middleware/validate.js";
import { changePasswordSchema, loginSchema, registerSchema, updateProfileSchema } from "./auth.schema.js";
import * as authController from "./auth.controller.js";
import { ROUTE_SEGMENTS } from "../../constants.js";

export const authRouter = Router();

authRouter.post(ROUTE_SEGMENTS.AUTH_REGISTER, authRateLimit, validate(registerSchema), authController.register);
authRouter.post(ROUTE_SEGMENTS.AUTH_LOGIN, authRateLimit, validate(loginSchema), authController.login);
authRouter.get(ROUTE_SEGMENTS.AUTH_ME, authenticate, authController.me);
authRouter.put(ROUTE_SEGMENTS.AUTH_ME, authenticate, validate(updateProfileSchema), authController.updateProfile);
authRouter.post(
  ROUTE_SEGMENTS.AUTH_CHANGE_PASSWORD,
  authRateLimit,
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword,
);

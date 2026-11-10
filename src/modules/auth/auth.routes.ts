import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authRateLimit } from "../../middleware/rate-limit.js";
import { validate } from "../../middleware/validate.js";
import { changePasswordSchema, loginSchema, registerSchema, updateProfileSchema } from "./auth.schema.js";
import * as authController from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/register", authRateLimit, validate(registerSchema), authController.register);
authRouter.post("/login", authRateLimit, validate(loginSchema), authController.login);
authRouter.get("/me", authenticate, authController.me);
authRouter.put("/me", authenticate, validate(updateProfileSchema), authController.updateProfile);
authRouter.post(
  "/change-password",
  authRateLimit,
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword,
);

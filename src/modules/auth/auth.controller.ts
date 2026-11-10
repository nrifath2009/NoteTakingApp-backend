import type { z } from "zod";
import { asyncHandler } from "../../middleware/async-handler.js";
import { validated } from "../../middleware/validate.js";
import { success } from "../../utils/api-response.js";
import { changePasswordSchema, loginSchema, registerSchema, updateProfileSchema } from "./auth.schema.js";
import * as authService from "./auth.service.js";

export const register = asyncHandler(async (req, res) => {
  const { body } = validated<z.infer<typeof registerSchema>>(req);
  const user = await authService.register(body);
  res.status(201).json(success(user));
});

export const login = asyncHandler(async (req, res) => {
  const { body } = validated<z.infer<typeof loginSchema>>(req);
  const session = await authService.login(body.email, body.password);
  res.json(success(session));
});

export const me = asyncHandler(async (req, res) => {
  res.json(success(authService.currentUser(req)));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { body } = validated<z.infer<typeof updateProfileSchema>>(req);
  const actor = authService.currentUser(req);
  const user = await authService.updateProfile(actor.id, body);
  res.json(success(user));
});

export const changePassword = asyncHandler(async (req, res) => {
  const { body } = validated<z.infer<typeof changePasswordSchema>>(req);
  const actor = authService.currentUser(req);
  await authService.changePassword(actor.id, body.currentPassword, body.newPassword);
  res.json(success({ message: "Password changed" }));
});

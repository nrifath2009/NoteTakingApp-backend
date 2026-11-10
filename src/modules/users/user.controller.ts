import type { z } from "zod";
import { asyncHandler } from "../../middleware/async-handler.js";
import { validated } from "../../middleware/validate.js";
import { success, successList } from "../../utils/api-response.js";
import {
  createUserSchema,
  listQuerySchema,
  updateUserSchema,
  userIdSchema,
} from "./user.schema.js";
import * as userService from "./user.service.js";

export const create = asyncHandler(async (req, res) => {
  const { body } = validated<z.infer<typeof createUserSchema>>(req);
  const user = await userService.createUser(body);
  res.status(201).json(success(user));
});

export const list = asyncHandler(async (req, res) => {
  const { query } = validated<z.infer<typeof listQuerySchema>>(req);
  const result = await userService.listUsers(query.page, query.limit);
  res.json(successList(result.users, result.pagination));
});

export const getById = asyncHandler(async (req, res) => {
  const { params } = validated<z.infer<typeof userIdSchema>>(req);
  const user = await userService.getUser(params.id);
  res.json(success(user));
});

export const update = asyncHandler(async (req, res) => {
  const { params, body } = validated<z.infer<typeof updateUserSchema>>(req);
  const user = await userService.updateUser(params.id, body);
  res.json(success(user));
});

export const remove = asyncHandler(async (req, res) => {
  const { params } = validated<z.infer<typeof userIdSchema>>(req);
  const result = await userService.deleteUser(params.id);
  res.json(success(result));
});

export const interests = asyncHandler(async (req, res) => {
  const { query } = validated<z.infer<typeof listQuerySchema>>(req);
  const result = await userService.groupUsersByInterest(query.page, query.limit);
  res.json(successList(result.data, result.pagination));
});

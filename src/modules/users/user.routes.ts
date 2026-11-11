import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import * as userController from "./user.controller.js";
import {
  createUserSchema,
  listQuerySchema,
  updateUserSchema,
  userIdSchema,
} from "./user.schema.js";
import { ROUTE_SEGMENTS, USER_ROLE } from "../../constants.js";

export const adminUserRouter = Router();

adminUserRouter.use(authenticate, authorize(USER_ROLE.ADMIN));
adminUserRouter.post(ROUTE_SEGMENTS.ROOT, validate(createUserSchema), userController.create);
adminUserRouter.get(ROUTE_SEGMENTS.ROOT, validate(listQuerySchema), userController.list);
adminUserRouter.get(ROUTE_SEGMENTS.ID, validate(userIdSchema), userController.getById);
adminUserRouter.put(ROUTE_SEGMENTS.ID, validate(updateUserSchema), userController.update);
adminUserRouter.delete(ROUTE_SEGMENTS.ID, validate(userIdSchema), userController.remove);

export const analyticsRouter = Router();

analyticsRouter.get(
  ROUTE_SEGMENTS.ANALYTICS_INTERESTS,
  authenticate,
  authorize(USER_ROLE.ADMIN),
  validate(listQuerySchema),
  userController.interests,
);

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

export const adminUserRouter = Router();

adminUserRouter.use(authenticate, authorize("admin"));
adminUserRouter.post("/", validate(createUserSchema), userController.create);
adminUserRouter.get("/", validate(listQuerySchema), userController.list);
adminUserRouter.get("/:id", validate(userIdSchema), userController.getById);
adminUserRouter.put("/:id", validate(updateUserSchema), userController.update);
adminUserRouter.delete("/:id", validate(userIdSchema), userController.remove);

export const analyticsRouter = Router();

analyticsRouter.get(
  "/interests",
  authenticate,
  authorize("admin"),
  validate(listQuerySchema),
  userController.interests,
);

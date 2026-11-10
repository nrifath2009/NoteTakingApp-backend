import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";
import * as postController from "./post.controller.js";
import { createPostSchema, listPostsSchema, userPostsSchema } from "./post.schema.js";

export const postRouter = Router();

postRouter.use(authenticate);
postRouter.post("/", validate(createPostSchema), postController.create);
postRouter.get("/", validate(listPostsSchema), postController.list);

export const userPostRouter = Router();

userPostRouter.get(
  "/:userId/posts",
  authenticate,
  validate(userPostsSchema),
  postController.listForUser,
);

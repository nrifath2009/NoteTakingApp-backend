import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";
import * as postController from "./post.controller.js";
import { createPostSchema, listPostsSchema, userPostsSchema } from "./post.schema.js";
import { ROUTE_SEGMENTS } from "../../constants.js";

export const postRouter = Router();

postRouter.use(authenticate);
postRouter.post(ROUTE_SEGMENTS.ROOT, validate(createPostSchema), postController.create);
postRouter.get(ROUTE_SEGMENTS.ROOT, validate(listPostsSchema), postController.list);

export const userPostRouter = Router();

userPostRouter.get(
  ROUTE_SEGMENTS.USER_POSTS,
  authenticate,
  validate(userPostsSchema),
  postController.listForUser,
);

import type { z } from "zod";
import { asyncHandler } from "../../middleware/async-handler.js";
import { requireUser } from "../../middleware/authenticate.js";
import { validated } from "../../middleware/validate.js";
import { success, successList } from "../../utils/api-response.js";
import { createPostSchema, listPostsSchema, userPostsSchema } from "./post.schema.js";
import * as postService from "./post.service.js";

export const create = asyncHandler(async (req, res) => {
  const actor = requireUser(req);
  const { body } = validated<z.infer<typeof createPostSchema>>(req);
  const post = await postService.createPost(actor.id, body);
  res.status(201).json(success(post));
});

export const list = asyncHandler(async (req, res) => {
  const { query } = validated<z.infer<typeof listPostsSchema>>(req);
  const result = await postService.listPosts(query.page, query.limit);
  res.json(successList(result.posts, result.pagination));
});

export const listForUser = asyncHandler(async (req, res) => {
  const { params, query } = validated<z.infer<typeof userPostsSchema>>(req);
  const result = await postService.listPostsForUser(params.userId, query.page, query.limit);
  res.json({
    success: true,
    data: { user: result.user, posts: result.posts },
    pagination: result.pagination,
  });
});

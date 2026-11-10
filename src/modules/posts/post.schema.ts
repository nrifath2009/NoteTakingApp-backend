import { z } from "zod";
import { objectIdSchema } from "../../utils/object-id.js";
import { paginationQuerySchema } from "../../utils/pagination.js";

const titleSchema = z.string().trim().min(1).max(200);
const contentSchema = z.string().trim().min(1).max(10000);

export const createPostSchema = z.object({
  body: z.object({
    title: titleSchema,
    content: contentSchema,
  }),
});

export const listPostsSchema = z.object({
  query: paginationQuerySchema,
});

export const userPostsSchema = z.object({
  params: z.object({ userId: objectIdSchema }),
  query: paginationQuerySchema,
});

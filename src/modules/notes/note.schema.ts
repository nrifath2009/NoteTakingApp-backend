import { z } from "zod";
import { objectIdSchema } from "../../utils/object-id.js";
import { paginationQuerySchema } from "../../utils/pagination.js";

const titleSchema = z.string().trim().min(1).max(200);
const contentSchema = z.string().trim().min(1).max(10000);

export const listNotesSchema = z.object({
  query: paginationQuerySchema,
});

export const noteIdSchema = z.object({
  params: z.object({ id: objectIdSchema }),
});

export const createNoteSchema = z.object({
  body: z.object({
    title: titleSchema,
    content: contentSchema,
  }),
});

export const updateNoteSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z
    .object({
      title: titleSchema.optional(),
      content: contentSchema.optional(),
    })
    .refine((value) => value.title !== undefined || value.content !== undefined, {
      message: "Provide title or content to update",
    }),
});

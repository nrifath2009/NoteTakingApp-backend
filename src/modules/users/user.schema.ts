import { z } from "zod";
import { objectIdSchema } from "../../utils/object-id.js";
import { paginationQuerySchema } from "../../utils/pagination.js";
import { API_MESSAGES, USER_ROLES } from "../../constants.js";

export { USER_ROLES };
export type UserRole = (typeof USER_ROLES)[number];

export const nameSchema = z.string().trim().min(1).max(100);
export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const passwordSchema = z
  .string()
  .min(8)
  .max(128)
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/[0-9]/, "Password must contain a number");
export const roleSchema = z.enum(USER_ROLES);

export const interestsSchema = z
  .array(z.string().trim().min(1).max(50).transform((value) => value.toLowerCase()))
  .max(20)
  .transform((values) => [...new Set(values)]);

export const listQuerySchema = z.object({
  query: paginationQuerySchema,
});

export const userIdSchema = z.object({
  params: z.object({ id: objectIdSchema }),
});

export const createUserSchema = z.object({
  body: z.object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    role: roleSchema,
    interests: interestsSchema.optional(),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z
    .object({
      name: nameSchema.optional(),
      email: emailSchema.optional(),
      role: roleSchema.optional(),
      interests: interestsSchema.optional(),
    })
    .refine(
      (value) =>
        value.name !== undefined ||
        value.email !== undefined ||
        value.role !== undefined ||
        value.interests !== undefined,
      { message: API_MESSAGES.PROVIDE_USER_FIELDS },
    ),
});

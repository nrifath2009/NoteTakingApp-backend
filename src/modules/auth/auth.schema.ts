import { z } from "zod";
import { emailSchema, interestsSchema, nameSchema, passwordSchema } from "../users/user.schema.js";
import { API_MESSAGES } from "../../constants.js";

export const registerSchema = z.object({
  body: z.object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    interests: interestsSchema.optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1),
  }),
});

export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z.string().min(1),
      newPassword: passwordSchema,
    })
    .refine((value) => value.currentPassword !== value.newPassword, {
      message: API_MESSAGES.NEW_PASSWORD_MUST_DIFFER,
      path: ["newPassword"],
    }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: nameSchema,
    email: emailSchema,
    interests: interestsSchema,
  }),
});

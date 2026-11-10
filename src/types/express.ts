import type { UserRole } from "../modules/users/user.schema.js";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  interests: string[];
  createdAt: Date;
  updatedAt: Date;
};

declare global {
  // Express publishes Request through this namespace. Merging it is the supported augmentation.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
      validated?: {
        body: unknown;
        params: unknown;
        query: unknown;
      };
    }
  }
}

export {};

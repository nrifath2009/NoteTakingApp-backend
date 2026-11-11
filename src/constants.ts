export const USER_ROLE = {
  USER: "user",
  ADMIN: "admin",
} as const;

export const USER_ROLES = [USER_ROLE.USER, USER_ROLE.ADMIN] as const;

export const NODE_ENV = {
  DEVELOPMENT: "development",
  TEST: "test",
  PRODUCTION: "production",
} as const;

export const AUTH_CONFIG = {
  JWT_ALGORITHM: "HS256",
  TOKEN_TYPE: "Bearer",
  BCRYPT_COST: 10,
} as const;

export const DEFAULT_CONFIG = {
  PORT: 5000,
  JWT_EXPIRES_IN: "15m",
  FRONTEND_URL: "http://localhost:5173",
  ADMIN_NAME: "Administrator",
} as const;

export const MONGO_NAMES = {
  USER_MODEL: "User",
  POSTS_COLLECTION: "posts",
} as const;

export const API_PATHS = {
  PREFIX: "/api",
  HEALTH: "/api/health",
  DOCS: "/api/docs",
  AUTH: "/api/auth",
  NOTES: "/api/notes",
  ADMIN_NOTES: "/api/admin/notes",
  ADMIN_USERS: "/api/admin/users",
  ADMIN_ANALYTICS: "/api/admin/analytics",
  POSTS: "/api/posts",
  USERS: "/api/users",
} as const;

export const ROUTE_SEGMENTS = {
  ROOT: "/",
  ID: "/:id",
  AUTH_REGISTER: "/register",
  AUTH_LOGIN: "/login",
  AUTH_ME: "/me",
  AUTH_CHANGE_PASSWORD: "/change-password",
  USER_POSTS: "/:userId/posts",
  ANALYTICS_INTERESTS: "/interests",
} as const;

export const API_MESSAGES = {
  AUTHENTICATION_REQUIRED: "Authentication required",
  FORBIDDEN: "Forbidden",
  INVALID_TOKEN: "Invalid or expired token",
  USER_NO_LONGER_EXISTS: "User no longer exists",
  INVALID_TOKEN_PAYLOAD: "Invalid token payload",
  INVALID_CREDENTIALS: "Invalid email or password",
  CURRENT_PASSWORD_INCORRECT: "Current password is incorrect",
  RESOURCE_NOT_FOUND: "Resource not found",
  EMAIL_ALREADY_REGISTERED: "Email already registered",
  LAST_ADMIN_REMOVAL: "Cannot remove the last administrator",
  INVALID_ID: "Invalid id",
  INVALID_JSON: "Invalid JSON",
  INTERNAL_SERVER_ERROR: "Internal server error",
  TOO_MANY_REQUESTS: "Too many requests",
  VALIDATION_ERROR: "Validation error",
  PASSWORD_CHANGED: "Password changed",
  PROVIDE_TITLE_OR_CONTENT: "Provide title or content to update",
  PROVIDE_USER_FIELDS: "Provide at least one field to update",
  NEW_PASSWORD_MUST_DIFFER: "New password must be different",
  INVALID_ENVIRONMENT_CONFIG: "Invalid environment configuration",
} as const;
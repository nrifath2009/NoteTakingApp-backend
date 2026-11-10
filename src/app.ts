import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { setupSwagger } from "./docs/swagger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { apiRateLimit } from "./middleware/rate-limit.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { adminNoteRouter, noteRouter } from "./modules/notes/note.routes.js";
import { postRouter, userPostRouter } from "./modules/posts/post.routes.js";
import { adminUserRouter, analyticsRouter } from "./modules/users/user.routes.js";
import { AppError } from "./utils/app-error.js";
import { success } from "./utils/api-response.js";

export function createApp() {
  const app = express();

  app.use(
    helmet({
      // Swagger UI needs inline scripts/styles. The API still sends the rest of Helmet's headers.
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:"],
        },
      },
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(
    cors({
      origin: env.frontendUrl,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Authorization", "Content-Type"],
    }),
  );
  app.use(express.json({ limit: "100kb" }));
  app.use("/api", apiRateLimit);

  app.get("/api/health", (_req, res) => {
    res.json(success({ status: "ok" }));
  });

  app.use("/api/auth", authRouter);
  app.use("/api/notes", noteRouter);
  app.use("/api/admin/notes", adminNoteRouter);
  app.use("/api/admin/users", adminUserRouter);
  app.use("/api/admin/analytics", analyticsRouter);
  app.use("/api/posts", postRouter);
  app.use("/api/users", userPostRouter);

  setupSwagger(app);

  app.use((_req, _res, next) => {
    next(new AppError("Resource not found", 404));
  });
  app.use(errorHandler);

  return app;
}

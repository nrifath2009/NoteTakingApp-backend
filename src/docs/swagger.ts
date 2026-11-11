import fs from "node:fs";
import path from "node:path";
import type { Express } from "express";
import swaggerUi from "swagger-ui-express";
import { parse } from "yaml";
import { API_PATHS } from "../constants.js";

export function setupSwagger(app: Express): void {
  const specPath = path.resolve(process.cwd(), "src/docs/openapi.yaml");
  const spec = parse(fs.readFileSync(specPath, "utf8")) as Record<string, unknown>;
  app.use(API_PATHS.DOCS, swaggerUi.serve, swaggerUi.setup(spec));
}

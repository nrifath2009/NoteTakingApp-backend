import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globalSetup: ["./tests/global-setup.ts"],
    setupFiles: ["./tests/setup.ts"],
    fileParallelism: false,
    maxWorkers: 1,
    globalSetupTimeout: 180000,
    hookTimeout: 60000,
    testTimeout: 30000,
    env: {
      NODE_ENV: "test",
      PORT: "5000",
      MONGODB_URI: "mongodb://127.0.0.1:27017/secure_notes_placeholder",
      JWT_SECRET: "test-secret-value-123456",
      JWT_ISSUER: "secure-notes-api",
      JWT_AUDIENCE: "secure-notes-client",
      JWT_EXPIRES_IN: "15m",
      ADMIN_EMAIL: "admin@example.com",
      ADMIN_PASSWORD: "ChangeThisPassword123!",
      FRONTEND_URL: "http://localhost:5173",
    },
  },
});

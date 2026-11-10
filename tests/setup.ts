import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll } from "vitest";

const uriFile = path.join(path.dirname(fileURLToPath(import.meta.url)), ".mongo-uri");

beforeAll(async () => {
  const uri = fs.readFileSync(uriFile, "utf8").trim();
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
});

afterEach(async () => {
  for (const collection of Object.values(mongoose.connection.collections)) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});

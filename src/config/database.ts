import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDatabase(uri = env.mongodbUri): Promise<void> {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, {
    autoIndex: env.nodeEnv !== "production",
  });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}

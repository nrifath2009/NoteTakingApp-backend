import mongoose from "mongoose";
import { env } from "./env.js";
import { NODE_ENV } from "../constants.js";

export async function connectDatabase(uri = env.mongodbUri): Promise<void> {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, {
    autoIndex: env.nodeEnv !== NODE_ENV.PRODUCTION,
  });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}

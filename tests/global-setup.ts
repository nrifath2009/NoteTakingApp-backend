import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoMemoryServer } from "mongodb-memory-server";

const uriFile = path.join(path.dirname(fileURLToPath(import.meta.url)), ".mongo-uri");

export async function setup(): Promise<() => Promise<void>> {
  const mongo = await MongoMemoryServer.create();
  fs.writeFileSync(uriFile, mongo.getUri(), "utf8");
  return async () => {
    await mongo.stop();
    fs.rmSync(uriFile, { force: true });
  };
}

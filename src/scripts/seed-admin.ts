import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { env } from "../config/env.js";
import { seedAdmin } from "../modules/users/user.service.js";

try {
  await connectDatabase();
  const result = await seedAdmin(env.adminEmail, env.adminPassword);
  if (result.created) {
    console.log(`Created admin ${env.adminEmail}`);
  } else {
    console.log(`Admin ${env.adminEmail} already exists. Password was not changed.`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}

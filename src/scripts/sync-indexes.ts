import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { Note } from "../modules/notes/note.model.js";
import { Post } from "../modules/posts/post.model.js";
import { User } from "../modules/users/user.model.js";

try {
  await connectDatabase();
  await Promise.all([User.createIndexes(), Note.createIndexes(), Post.createIndexes()]);

  for (const model of [User, Note, Post]) {
    const indexes = await model.collection.indexes();
    console.log(
      model.collection.name,
      indexes.map((index) => index.name),
    );
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}

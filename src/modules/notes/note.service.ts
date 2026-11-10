import type { NoteModelDocument } from "./note.model.js";
import { Note } from "./note.model.js";
import type { UserRole } from "../users/user.schema.js";
import { AppError } from "../../utils/app-error.js";
import { LIST_SORT, paginationMeta } from "../../utils/pagination.js";

export type PublicNote = {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

export function toPublicNote(note: NoteModelDocument): PublicNote {
  return {
    id: note.id,
    userId: note.userId.toString(),
    title: note.title,
    content: note.content,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

async function paginate(filter: Record<string, unknown>, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [notes, total] = await Promise.all([
    Note.find(filter).sort(LIST_SORT).skip(skip).limit(limit),
    Note.countDocuments(filter),
  ]);
  return { notes: notes.map(toPublicNote), pagination: paginationMeta(page, limit, total) };
}

export function listOwnNotes(userId: string, page: number, limit: number) {
  return paginate({ userId }, page, limit);
}

export function listAllNotes(page: number, limit: number) {
  return paginate({}, page, limit);
}

export async function getNote(
  id: string,
  actor: { id: string; role: UserRole },
): Promise<PublicNote> {
  const note =
    actor.role === "admin"
      ? await Note.findById(id)
      : await Note.findOne({ _id: id, userId: actor.id });
  if (!note) throw new AppError("Resource not found", 404);
  return toPublicNote(note);
}

export async function createNote(
  userId: string,
  input: { title: string; content: string },
): Promise<PublicNote> {
  const note = await Note.create({ userId, title: input.title, content: input.content });
  return toPublicNote(note);
}

export async function updateNote(
  id: string,
  userId: string,
  input: { title?: string; content?: string },
): Promise<PublicNote> {
  const note = await Note.findOneAndUpdate(
    { _id: id, userId },
    { $set: input },
    { new: true, runValidators: true },
  );
  if (!note) throw new AppError("Resource not found", 404);
  return toPublicNote(note);
}

export async function deleteNote(id: string, userId: string): Promise<{ id: string }> {
  const note = await Note.findOneAndDelete({ _id: id, userId });
  if (!note) throw new AppError("Resource not found", 404);
  return { id: note.id };
}

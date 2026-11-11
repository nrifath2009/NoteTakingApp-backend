import mongoose, { type HydratedDocument } from "mongoose";
import { MONGO_NAMES } from "../../constants.js";

export interface NoteDocument {
  userId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new mongoose.Schema<NoteDocument>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: MONGO_NAMES.USER_MODEL, required: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
  },
  { timestamps: true },
);

// Own notes: filter by userId, sort createdAt/_id, paginate.
noteSchema.index({ userId: 1, createdAt: -1, _id: -1 });

// Admin list of every note, same sort, no user filter.
noteSchema.index({ createdAt: -1, _id: -1 });

export const Note = mongoose.model<NoteDocument>("Note", noteSchema);
export type NoteModelDocument = HydratedDocument<NoteDocument>;
export { noteSchema };

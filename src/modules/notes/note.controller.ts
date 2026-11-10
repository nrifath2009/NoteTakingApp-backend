import type { z } from "zod";
import { asyncHandler } from "../../middleware/async-handler.js";
import { requireUser } from "../../middleware/authenticate.js";
import { validated } from "../../middleware/validate.js";
import { success, successList } from "../../utils/api-response.js";
import {
  createNoteSchema,
  listNotesSchema,
  noteIdSchema,
  updateNoteSchema,
} from "./note.schema.js";
import * as noteService from "./note.service.js";

export const create = asyncHandler(async (req, res) => {
  const actor = requireUser(req);
  const { body } = validated<z.infer<typeof createNoteSchema>>(req);
  const note = await noteService.createNote(actor.id, body);
  res.status(201).json(success(note));
});

export const listMine = asyncHandler(async (req, res) => {
  const actor = requireUser(req);
  const { query } = validated<z.infer<typeof listNotesSchema>>(req);
  const result = await noteService.listOwnNotes(actor.id, query.page, query.limit);
  res.json(successList(result.notes, result.pagination));
});

export const listAll = asyncHandler(async (req, res) => {
  const { query } = validated<z.infer<typeof listNotesSchema>>(req);
  const result = await noteService.listAllNotes(query.page, query.limit);
  res.json(successList(result.notes, result.pagination));
});

export const getById = asyncHandler(async (req, res) => {
  const actor = requireUser(req);
  const { params } = validated<z.infer<typeof noteIdSchema>>(req);
  const note = await noteService.getNote(params.id, actor);
  res.json(success(note));
});

export const update = asyncHandler(async (req, res) => {
  const actor = requireUser(req);
  const { params, body } = validated<z.infer<typeof updateNoteSchema>>(req);
  const note = await noteService.updateNote(params.id, actor.id, body);
  res.json(success(note));
});

export const remove = asyncHandler(async (req, res) => {
  const actor = requireUser(req);
  const { params } = validated<z.infer<typeof noteIdSchema>>(req);
  const result = await noteService.deleteNote(params.id, actor.id);
  res.json(success(result));
});

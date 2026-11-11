import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import * as noteController from "./note.controller.js";
import {
  createNoteSchema,
  listNotesSchema,
  noteIdSchema,
  updateNoteSchema,
} from "./note.schema.js";
import { ROUTE_SEGMENTS, USER_ROLE } from "../../constants.js";

export const noteRouter = Router();

noteRouter.use(authenticate);
noteRouter.post(ROUTE_SEGMENTS.ROOT, validate(createNoteSchema), noteController.create);
noteRouter.get(ROUTE_SEGMENTS.ROOT, validate(listNotesSchema), noteController.listMine);
noteRouter.get(ROUTE_SEGMENTS.ID, validate(noteIdSchema), noteController.getById);
noteRouter.put(ROUTE_SEGMENTS.ID, validate(updateNoteSchema), noteController.update);
noteRouter.delete(ROUTE_SEGMENTS.ID, validate(noteIdSchema), noteController.remove);

export const adminNoteRouter = Router();

adminNoteRouter.get(
  ROUTE_SEGMENTS.ROOT,
  authenticate,
  authorize(USER_ROLE.ADMIN),
  validate(listNotesSchema),
  noteController.listAll,
);

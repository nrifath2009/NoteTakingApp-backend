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

export const noteRouter = Router();

noteRouter.use(authenticate);
noteRouter.post("/", validate(createNoteSchema), noteController.create);
noteRouter.get("/", validate(listNotesSchema), noteController.listMine);
noteRouter.get("/:id", validate(noteIdSchema), noteController.getById);
noteRouter.put("/:id", validate(updateNoteSchema), noteController.update);
noteRouter.delete("/:id", validate(noteIdSchema), noteController.remove);

export const adminNoteRouter = Router();

adminNoteRouter.get(
  "/",
  authenticate,
  authorize("admin"),
  validate(listNotesSchema),
  noteController.listAll,
);

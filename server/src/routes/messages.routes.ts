import { Router } from "express";
import {
  createMessage,
  deleteMessage,
  getMessageById,
  getMessages,
} from "../controllers/messages.controller";
import {
  requireAdmin,
  requireManagerOrResident,
  requireManager,
} from "../middlewares/session.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createMessageSchema } from "../validators/message.validator";

const router = Router();

router.post("/", requireManager, validate(createMessageSchema), createMessage);
router.get("/", requireManagerOrResident, getMessages);
router.get("/:messageId", requireManagerOrResident, getMessageById);
router.delete("/:messageId", requireAdmin, deleteMessage);

export default router;

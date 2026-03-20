import { Router } from "express";
import {
  createMessage,
  deleteMessage,
  getMessageById,
  getMessages,
} from "../controllers/messages.controller";
import { requireManager } from "../middlewares/session.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createMessageSchema } from "../validators/message.validator";

const router = Router();

router.post("/", requireManager, validate(createMessageSchema), createMessage);
router.get("/", getMessages);
router.get("/:messageId", getMessageById);
router.delete("/:messageId", requireManager, deleteMessage);

export default router;

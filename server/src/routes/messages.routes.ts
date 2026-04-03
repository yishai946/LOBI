import { Router } from "express";
import {
  createMessage,
  deleteMessage,
  getMessageById,
  getMessages,
  updateMessage,
} from "../controllers/messages.controller";
import { validate } from "../middlewares/validate.middleware";
import {
  createMessageSchema,
  updateMessageSchema,
} from "../validators/message.validator";

const router = Router();

router.post("/", validate(createMessageSchema), createMessage);
router.get("/", getMessages);
router.get("/:messageId", getMessageById);
router.patch("/:messageId", validate(updateMessageSchema), updateMessage);
router.delete("/:messageId", deleteMessage);

export default router;

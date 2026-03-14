import { Router } from "express";
import {
  createManager,
  deleteManager,
  getManagerById,
  getManagers,
} from "../controllers/managers.controller";
import { requireAdmin } from "../middlewares/session.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createManagerSchema } from "../validators/manager.validator";

const router = Router();

router.post("/", requireAdmin, validate(createManagerSchema), createManager);
router.get("/", requireAdmin, getManagers);
router.get("/:managerId", requireAdmin, getManagerById);
router.delete("/:managerId", requireAdmin, deleteManager);

export default router;

import { Router } from "express";
import { createManager, createResident } from "../controllers/users.controller";
import { requireAdmin, requireManager } from "../middlewares/session.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createManagerSchema,
  createResidentSchema,
} from "../validators/user.validator";

const router = Router();

router.post(
  "/resident",
  requireManager,
  validate(createResidentSchema),
  createResident,
);

router.post(
  "/manager",
  requireAdmin,
  validate(createManagerSchema),
  createManager,
);

export default router;

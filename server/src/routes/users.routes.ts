import { Router } from "express";
import {
  createManager,
  createResident,
  deleteUser,
  getMe,
  getUserById,
  getUsers,
  updateMe,
} from "../controllers/users.controller";
import { requireAdmin, requireManager } from "../middlewares/session.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createManagerSchema,
  createResidentSchema,
  updateMeSchema,
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

router.get("/me", getMe);
router.patch("/me", validate(updateMeSchema), updateMe);
router.get("/", requireAdmin, getUsers);
router.get("/:userId", requireAdmin, getUserById);
router.delete("/:userId", requireAdmin, deleteUser);

export default router;

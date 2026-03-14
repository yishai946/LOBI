import { Router } from "express";
import {
  createResident,
  deleteResident,
  getResidentById,
  getResidents,
  updateResident,
} from "../controllers/residents.controller";
import { requireManager } from "../middlewares/session.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createResidentSchema,
  updateResidentSchema,
} from "../validators/resident.validator";

const router = Router();

router.post("/", requireManager, validate(createResidentSchema), createResident);
router.get("/", requireManager, getResidents);
router.get("/:residentId", requireManager, getResidentById);
router.patch(
  "/:residentId",
  requireManager,
  validate(updateResidentSchema),
  updateResident,
);
router.delete("/:residentId", requireManager, deleteResident);

export default router;

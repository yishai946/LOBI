import { Router } from "express";
import { requireAdmin, requireBuildingAccess } from "../middlewares/session.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createBuildingSchema,
  updateBuildingSchema,
} from "../validators/building.validator";
import {
  createBuilding,
  deleteBuilding,
  getAllBuildings,
  getBuildingById,
  updateBuilding,
} from "../controllers/building.controller";

const router = Router();

router.post("/", requireAdmin, validate(createBuildingSchema), createBuilding);
router.get("/", requireAdmin, getAllBuildings);
router.get("/:id", requireBuildingAccess, getBuildingById);
router.patch("/:id", requireAdmin, validate(updateBuildingSchema), updateBuilding);
router.delete("/:id", requireAdmin, deleteBuilding);

export default router;

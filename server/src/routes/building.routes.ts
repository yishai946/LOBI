import { Router } from "express";
import { requireAdmin, requireBuildingAccess, requireManager } from "../middlewares/session.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createBuildingSchema,
  updateBuildingSchema,
} from "../validators/building.validator";
import { upgradeRequestSchema } from "../validators/upgradeRequest.validator";
import {
  createBuilding,
  deleteBuilding,
  getAllBuildings,
  getBuildingById,
  updateBuilding,
} from "../controllers/building.controller";
import {
  createUpgradeRequest,
  getUpgradeRequestSummary,
} from "../controllers/upgradeRequest.controller";

const router = Router();

router.post("/", requireAdmin, validate(createBuildingSchema), createBuilding);
router.get("/", requireAdmin, getAllBuildings);
router.get("/:id", requireBuildingAccess, getBuildingById);
router.patch("/:id", requireAdmin, validate(updateBuildingSchema), updateBuilding);
router.delete("/:id", requireAdmin, deleteBuilding);
router.post("/upgrade-request", validate(upgradeRequestSchema), createUpgradeRequest);
router.get(
  "/:buildingId/upgrade-request/summary",
  requireManager,
  getUpgradeRequestSummary,
);

export default router;

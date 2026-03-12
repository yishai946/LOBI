import { Router } from "express";
import { requireAdmin, requireBuildingAccess } from "../middlewares/session.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createBuildingSchema } from "../validators/building.validator";
import { createBuilding, getAllBuildings, getBuildingById } from "../controllers/building.controller";

const router = Router();

router.post("/", requireAdmin, validate(createBuildingSchema), createBuilding);
router.get("/", requireAdmin, getAllBuildings);
router.get("/:id", requireBuildingAccess, getBuildingById);

export default router;

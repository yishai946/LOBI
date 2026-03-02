import { Router } from "express";
import { requireAdmin } from "../middlewares/session.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createBuildingSchema } from "../validators/building.validator";
import { createBuilding } from "../controllers/building.controller";

const router = Router();

router.post("/", requireAdmin, validate(createBuildingSchema), createBuilding);

export default router;

import { Router } from "express";
import { createApartment } from "../controllers/apartment.controller";
import { requireManager } from "../middlewares/session.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createApartmentSchema } from "../validators/apartment.validator";

const router = Router();

router.post("/", requireManager, validate(createApartmentSchema), createApartment);

export default router;

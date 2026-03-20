import { Router } from "express";
import {
  createApartment,
  deleteApartment,
  getApartmentById,
  getApartments,
  updateApartment,
} from "../controllers/apartment.controller";
import { requireApartmentAccess, requireManager } from "../middlewares/session.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createApartmentSchema,
  updateApartmentSchema,
} from "../validators/apartment.validator";

const router = Router();

router.post("/", requireManager, validate(createApartmentSchema), createApartment);
router.get("/", requireManager, getApartments);
router.get("/:id", requireApartmentAccess, getApartmentById);
router.patch("/:id", requireManager, validate(updateApartmentSchema), updateApartment);
router.delete("/:id", requireManager, deleteApartment);

export default router;

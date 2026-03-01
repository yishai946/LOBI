// src/routes/userRoutes.ts
import { Router } from "express";
import { createResident } from "../controllers/users.controller";
import { requireRole } from "../middlewares/role.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createResidentSchema } from "../validators/user.validator";

const router = Router();

router.post(
  "/resident",
  requireRole("ADMIN"),
  validate(createResidentSchema),
  createResident,
);

export default router;

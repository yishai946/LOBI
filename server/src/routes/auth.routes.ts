import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  completeProfile,
  resendOtp,
  refreshToken,
  requestOtp,
  selectContext,
  verifyOtp,
} from "../controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";
import {
  completeProfileSchema,
  requestOtpSchema,
  selectContextSchema,
  verifyOtpSchema,
} from "../validators/auth.validaor";

const router = Router();

router.post("/request-otp", validate(requestOtpSchema), requestOtp);
router.post("/resend-otp", validate(requestOtpSchema), resendOtp);
router.post("/verify-otp", validate(verifyOtpSchema), verifyOtp);
router.post("/refresh", refreshToken);
router.post(
  "/complete-profile",
  authMiddleware,
  validate(completeProfileSchema),
  completeProfile,
);
router.post(
  "/select-context",
  authMiddleware,
  validate(selectContextSchema),
  selectContext,
);

export default router;

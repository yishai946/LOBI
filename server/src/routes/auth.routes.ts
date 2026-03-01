import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { completeProfile, requestOtp, verifyOtp } from "../controllers/auth.controller";

const router = Router();

router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);
router.post("/complete-profile", authMiddleware, completeProfile);

export default router;

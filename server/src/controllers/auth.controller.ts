import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { AuthRequest } from "../middlewares/auth.middleware";

export const requestOtp = async (req: Request, res: Response) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ message: "Phone required" });
  }

  const result = await authService.requestOtp(phone);
  res.json(result);
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ message: "Phone and OTP required" });
  }

  const result = await authService.verifyOtp(phone, otp);
  res.json(result);
};

export const completeProfile = async (req: AuthRequest, res: Response) => {
  const { name } = req.body;

  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!name) {
    return res.status(400).json({ message: "Name required" });
  }

  const updatedUser = await authService.completeProfile(req.user.userId, name);

  res.json({
    message: "Profile completed",
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
    },
  });
};


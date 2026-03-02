import { Request, Response } from "express";
import * as authService from "../services/auth.service";

export const requestOtp = async (req: Request, res: Response) => {
  const { phone } = req.body;

  const result = await authService.requestOtp(phone);
  res.json(result);
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { phone, otp } = req.body;

  const result = await authService.verifyOtp(phone, otp);
  res.json(result);
};

export const completeProfile = async (req: Request, res: Response) => {
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

export const selectContext = async (req: Request, res: Response) => {
  const { type, buildingId, apartmentId } = req.body;
  
  const result = await authService.selectContext(
    req.user.userId,
    type,
    buildingId,
    apartmentId,
  );

  res.json(result);
};


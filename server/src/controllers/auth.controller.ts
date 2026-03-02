import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import * as authService from "../services/auth.service";
import { HttpError } from "../utils/HttpError";

export const requestOtp = async (req: Request, res: Response) => {
  const { phone } = req.body;

  const result = await authService.requestOtp(phone);
  res.json(result);
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { phone, otp } = req.body;

  const user = await authService.verifyOtp(phone, otp);
  const accessToken = await authService.generateAccessToken(user.id);
  const refreshToken = authService.generateRefreshToken(user.id);
  
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json(accessToken);
};

export const refreshToken = async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;
  if (!token) {
    throw new HttpError("Refresh token missing", 401);
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as {
      userId: string;
    };

    const accessToken = await authService.generateAccessToken(payload.userId);
    const newRefreshToken = authService.generateRefreshToken(payload.userId);

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken });
  } catch (err) {
    throw new HttpError("Invalid refresh token", 401);
  }
};


export const completeProfile = async (req: Request, res: Response) => {
  const { name } = req.body;

  if (!req.user) {
    throw new HttpError("Unauthorized", 401);
  }

  if (!name) {
    throw new HttpError("Name required", 400);
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


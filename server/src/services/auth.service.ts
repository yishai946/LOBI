import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import logger from "../utils/logger";
import { HttpError } from "../utils/HttpError";
import { SessionType } from "../enums/sessionType.enum";
import { sessionInitializers } from "../helpers/auth.helper";

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const OTP_EXPIRATION_MINUTES = 5;

export const requestOtp = async (phone: string) => {
  const user = await prisma.user.findUnique({
    where: { phone },
  });

  if (!user) {
    throw new HttpError("User not registered in this building", 404);
  }

  if (!user.isActive) {
    throw new HttpError("User is disabled", 403);
  }

  const otp = generateOtp();
  const expires = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      otpCode: otp,
      otpExpires: expires,
    },
  });

  logger.info(
    `OTP for ${phone}: ${otp} (expires in ${OTP_EXPIRATION_MINUTES} minutes)`,
  );

  return { message: "OTP sent" };
};

export const verifyOtp = async (phone: string, otp: string) => {
  const user = await prisma.user.findUnique({
    where: { phone },
    include: {
      apartments: {
        include: {
          apartment: {
            include: { building: true },
          },
        },
      },
      manages: {
        include: {
          building: true,
        },
      },
    },
  });

  if (!user || !user.otpCode || !user.otpExpires) {
    throw new HttpError("Invalid request", 400);
  }

  if (user.otpCode !== otp) {
    throw new HttpError("Invalid OTP", 401);
  }

  if (user.otpExpires < new Date()) {
    throw new HttpError("OTP expired", 401);
  }

  const contexts = [
    ...user.apartments.map((a) => ({
      type: "RESIDENT",
      apartmentId: a.apartment.id,
      buildingId: a.apartment.buildingId,
      buildingName: a.apartment.building.name,
    })),
    ...user.manages.map((m) => ({
      type: "MANAGER",
      buildingId: m.building.id,
      buildingName: m.building.name,
    })),
  ];

 const loginToken = jwt.sign(
   {
     userId: user.id,
     systemRole: user.role,
     stage: "CONTEXT_SELECTION",
   },
   process.env.JWT_SECRET!,
   { expiresIn: "15m" },
 );

  await prisma.user.update({
    where: { id: user.id },
    data: {
      otpCode: null,
      otpExpires: null,
    },
  });

  return {
    loginToken,
    contexts,
    needsProfileCompletion: !user.name,
  };
};

export const completeProfile = async (userId: string, name: string) => {
  return prisma.user.update({
    where: { id: userId },
    data: { name },
  });
};

export const selectContext = async (
  userId: string,
  type: SessionType,
  buildingId?: string,
  apartmentId?: string,
) => {
  return sessionInitializers[type](userId, buildingId ?? apartmentId!);
};


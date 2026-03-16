import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import logger from "../utils/logger";
import { HttpError } from "../utils/HttpError";
import { SessionType } from "../enums/sessionType.enum";
import { sessionInitializers } from "../helpers/auth.helper";

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const OTP_EXPIRATION_MINUTES = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 60;

const issueOtpForUser = async (userId: string, phone: string) => {
  const otp = generateOtp();
  const expires = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: {
      otpCode: otp,
      otpExpires: expires,
    },
  });

  logger.info(
    `OTP for ${phone}: ${otp} (expires in ${OTP_EXPIRATION_MINUTES} minutes)`,
  );
};

export const requestOtp = async (phone: string) => {
  const user = await prisma.user.findUnique({
    where: { phone },
  });

  if (!user) {
    throw new HttpError("המשתמש אינו רשום בבניין זה", 404);
  }

  if (!user.isActive) {
    throw new HttpError("המשתמש מושבת", 403);
  }

  await issueOtpForUser(user.id, phone);

  return { message: "OTP sent" };
};

export const resendOtp = async (phone: string) => {
  const user = await prisma.user.findUnique({
    where: { phone },
  });

  if (!user) {
    throw new HttpError("המשתמש אינו רשום בבניין זה", 404);
  }

  if (!user.isActive) {
    throw new HttpError("המשתמש מושבת", 403);
  }

  if (!user.otpCode || !user.otpExpires) {
    throw new HttpError("בקש קוד OTP תחילה", 400);
  }

  const lastOtpIssuedAt = new Date(
    user.otpExpires.getTime() - OTP_EXPIRATION_MINUTES * 60 * 1000,
  );
  const resendAvailableAt = new Date(
    lastOtpIssuedAt.getTime() + OTP_RESEND_COOLDOWN_SECONDS * 1000,
  );

  if (resendAvailableAt > new Date()) {
    throw new HttpError("ניתן לשלוח OTP מחדש רק לאחר דקה", 429);
  }

  await issueOtpForUser(user.id, phone);

  return { message: "OTP resent" };
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
    throw new HttpError("בקשה לא תקינה", 400);
  }

  if (user.otpCode !== otp) {
    throw new HttpError("קוד OTP לא תקין", 401);
  }

  if (user.otpExpires < new Date()) {
    throw new HttpError("קוד OTP פג תוקף", 401);
  }

  const verifiedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      otpCode: null,
      otpExpires: null,
    },
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

  return verifiedUser;
};

export const generateAccessToken = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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

  if (!user) {
    throw new HttpError("המשתמש לא נמצא", 404);
  }

  const contexts = [
    ...(user.role === "ADMIN"
      ? [
          {
            type: "ADMIN",
          },
        ]
      : []),
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

  const payload = {
    userId: user.id,
    role: user.role,
    stage: contexts.length > 1 ? "CONTEXT_SELECTION" : "AUTHENTICATED",
  };

  const accessToken = jwt.sign(payload, process.env.ACCESS_SECRET!, {
    expiresIn: "15m",
  });

  return {
    accessToken,
    contexts,
    needsProfileCompletion: !user.name,
  };
};

export const generateRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.REFRESH_SECRET!, {
    expiresIn: "7d",
  });
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
  const id =
    type === SessionType.MANAGER
      ? buildingId
      : type === SessionType.RESIDENT
        ? apartmentId
        : undefined;

  return sessionInitializers[type](userId, id);
};

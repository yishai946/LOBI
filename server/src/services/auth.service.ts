import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const requestOtp = async (phone: string) => {
  const user = await prisma.user.findUnique({
    where: { phone },
  });

  if (!user) {
    throw new Error("User not registered in this building");
  }

  if (!user.isActive) {
    throw new Error("User is disabled");
  }

  const otp = generateOtp();
  const expires = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      otpCode: otp,
      otpExpires: expires,
    },
  });

  console.log("OTP:", otp); // Replace with SMS later

  return { message: "OTP sent" };
};

export const verifyOtp = async (phone: string, otp: string) => {
  const user = await prisma.user.findUnique({
    where: { phone },
    include: {
      apartment: {
        include: {
          building: true,
        },
      },
    },
  });

  if (!user || !user.otpCode || !user.otpExpires) {
    throw new Error("Invalid request");
  }

  if (user.otpCode !== otp) {
    throw new Error("Invalid OTP");
  }

  if (user.otpExpires < new Date()) {
    throw new Error("OTP expired");
  }

  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role,
      apartmentId: user.apartmentId,
      buildingId: user.apartment.buildingId,
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" },
  );

  await prisma.user.update({
    where: { id: user.id },
    data: {
      otpCode: null,
      otpExpires: null,
    },
  });

  return {
    token,
    needsProfileCompletion: !user.name,
  };
};

export const completeProfile = async (userId: string, name: string) => {
  return prisma.user.update({
    where: { id: userId },
    data: { name },
  });
};


import jwt from "jsonwebtoken";
import { HttpError } from "../utils/HttpError";
import prisma from "../lib/prisma";
import { SessionType } from "../enums/sessionType.enum";

const issueSessionToken = (payload: {
  userId: string;
  sessionType: SessionType;
  buildingId?: string;
  apartmentId?: string;
}) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "7d" });

  return { token };
};

const initializeManagerSession = async (userId: string, buildingId?: string) => {
  const relation = await prisma.manager.findUnique({
    where: {
      userId_buildingId: {
        userId,
        buildingId: buildingId!,
      },
    },
  });

  if (!relation) {
    throw new HttpError("Not manager of this building", 403);
  }

  return issueSessionToken({
    userId,
    sessionType: SessionType.MANAGER,
    buildingId,
  });
};

const initializeResidentSession = async (
  userId: string,
  apartmentId?: string,
) => {
  const relation = await prisma.resident.findUnique({
    where: {
      userId_apartmentId: {
        userId,
        apartmentId: apartmentId!,
      },
    },
  });

  if (!relation) {
    throw new HttpError("Not resident of this apartment", 403);
  }

  const apartment = await prisma.apartment.findUnique({
    where: { id: apartmentId! },
  });

  return issueSessionToken({
    userId,
    sessionType: SessionType.RESIDENT,
    apartmentId,
    buildingId: apartment?.buildingId,
  });
};

const initializeAdminSession = async (userId: string) => issueSessionToken({
  userId,
  sessionType: SessionType.ADMIN,
});


export const sessionInitializers: Record<
  SessionType,
  (userId: string, id?: string) => Promise<{ token: string }>
> = {
  MANAGER: initializeManagerSession,
  RESIDENT: initializeResidentSession,
  ADMIN: initializeAdminSession,
};

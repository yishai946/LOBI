import { SessionType } from "../enums/sessionType.enum";
import {
  attachManager,
  attachResident,
  getOrCreateUser,
} from "../helpers/user.helper";
import prisma from "../lib/prisma";
import { SessionPayload } from "../types/auth";
import { HttpError } from "../utils/HttpError";
import {
  CreateManagerCommand,
  CreateResidentCommand,
  UpdateMeCommand,
} from "../validators/user.validator";

export const createResident = async (
  currentUser: SessionPayload,
  { phone, apartmentId }: CreateResidentCommand,
) => {
  const apartment = await prisma.apartment.findUnique({
    where: { id: apartmentId },
    select: { buildingId: true },
  });

  if (!apartment) throw new HttpError("הדירה לא נמצאה", 404);

  if (
    currentUser.sessionType === SessionType.MANAGER &&
    currentUser.buildingId !== apartment.buildingId
  ) {
    throw new HttpError("אסור", 403);
  }

  const user = await getOrCreateUser(phone);

  return attachResident(user.id, apartmentId);
};

export const createManager = async ({
  phone,
  buildingId,
}: CreateManagerCommand) => {
  const building = await prisma.building.findUnique({
    where: { id: buildingId },
  });

  if (!building) {
    throw new HttpError("הבניין לא נמצא", 404);
  }

  const user = await getOrCreateUser(phone);

  return attachManager(user.id, buildingId);
};

export const getMe = async (currentUser: SessionPayload) => {
  return prisma.user.findUnique({
    where: { id: currentUser.userId },
  });
};

export const updateMe = async (
  currentUser: SessionPayload,
  data: UpdateMeCommand,
) => {
  if (!data.name) {
    throw new HttpError("לא סופקו עדכונים", 400);
  }

  return prisma.user.update({
    where: { id: currentUser.userId },
    data: { name: data.name },
  });
};

export const getAllUsers = async () => {
  return prisma.user.findMany();
};

export const getUserById = async (userId: string) => {
  return prisma.user.findUnique({ where: { id: userId } });
};

export const deleteUser = async (userId: string) => {
  return prisma.user.delete({ where: { id: userId } });
};

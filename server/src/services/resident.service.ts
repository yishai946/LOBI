import prisma from "../lib/prisma";
import { HttpError } from "../utils/HttpError";
import { SessionPayload } from "../types/auth";
import { SessionType } from "../enums/sessionType.enum";
import {
  CreateResidentCommand,
  UpdateResidentCommand,
} from "../validators/resident.validator";
import { PaginationOptions } from "../utils/pagination";

const ensureBuildingAccess = async (
  currentUser: SessionPayload,
  buildingId: string,
) => {
  if (currentUser.sessionType === SessionType.ADMIN) return;

  if (currentUser.buildingId !== buildingId) {
    throw new HttpError("אסור", 403);
  }
};

export const createResident = async (
  currentUser: SessionPayload,
  data: CreateResidentCommand,
) => {
  const apartment = await prisma.apartment.findUnique({
    where: { id: data.apartmentId },
    select: { buildingId: true },
  });

  if (!apartment) throw new HttpError("הדירה לא נמצאה", 404);

  await ensureBuildingAccess(currentUser, apartment.buildingId);

  return prisma.resident.create({
    data: {
      userId: data.userId,
      apartmentId: data.apartmentId,
    },
  });
};

export const getResidents = async (
  currentUser: SessionPayload,
  pagination: PaginationOptions = {},
) => {
  const { limit, skip } = pagination;

  if (currentUser.sessionType === SessionType.ADMIN) {
    return prisma.resident.findMany({
      include: { user: true, apartment: true },
      skip,
      take: limit,
    });
  }

  if (!currentUser.buildingId) {
    throw new HttpError("נדרש הקשר בניין", 400);
  }

  return prisma.resident.findMany({
    where: { apartment: { buildingId: currentUser.buildingId } },
    include: { user: true, apartment: true },
    skip,
    take: limit,
  });
};

export const getResidentById = async (
  currentUser: SessionPayload,
  residentId: string,
) => {
  const resident = await prisma.resident.findUnique({
    where: { id: residentId },
    include: { user: true, apartment: true },
  });

  if (!resident) throw new HttpError("הדייר לא נמצא", 404);

  await ensureBuildingAccess(currentUser, resident.apartment.buildingId);

  return resident;
};

export const updateResident = async (
  currentUser: SessionPayload,
  residentId: string,
  data: UpdateResidentCommand,
) => {
  const resident = await prisma.resident.findUnique({
    where: { id: residentId },
    include: { apartment: true },
  });

  if (!resident) throw new HttpError("הדייר לא נמצא", 404);

  await ensureBuildingAccess(currentUser, resident.apartment.buildingId);

  if (!data.apartmentId) {
    throw new HttpError("לא סופקו עדכונים", 400);
  }

  const newApartment = await prisma.apartment.findUnique({
    where: { id: data.apartmentId },
    select: { buildingId: true },
  });

  if (!newApartment) throw new HttpError("הדירה לא נמצאה", 404);

  await ensureBuildingAccess(currentUser, newApartment.buildingId);

  return prisma.resident.update({
    where: { id: residentId },
    data: { apartmentId: data.apartmentId },
  });
};

export const deleteResident = async (
  currentUser: SessionPayload,
  residentId: string,
) => {
  const resident = await prisma.resident.findUnique({
    where: { id: residentId },
    include: { apartment: true },
  });

  if (!resident) throw new HttpError("הדייר לא נמצא", 404);

  await ensureBuildingAccess(currentUser, resident.apartment.buildingId);

  return prisma.resident.delete({ where: { id: residentId } });
};

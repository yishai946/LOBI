import prisma from "../lib/prisma";
import {
  CreateApartmentCommand,
  UpdateApartmentCommand,
} from "../validators/apartment.validator";
import { SessionPayload } from "../types/auth";
import { HttpError } from "../utils/HttpError";
import { SessionType } from "../enums/sessionType.enum";
import { PaginationOptions } from "../utils/pagination";

export const create = async (data: CreateApartmentCommand) =>
  prisma.apartment.create({ data });

const ensureAccess = async (
  currentUser: SessionPayload,
  buildingId: string,
) => {
  if (currentUser.sessionType === SessionType.ADMIN) return;

  if (currentUser.buildingId !== buildingId) {
    throw new HttpError("אסור", 403);
  }
};

export const getAll = async (
  currentUser: SessionPayload,
  pagination: PaginationOptions = {},
) => {
  const { limit, skip } = pagination;

  if (currentUser.sessionType === SessionType.ADMIN) {
    return prisma.apartment.findMany({
      skip,
      take: limit,
    });
  }

  if (!currentUser.buildingId) {
    throw new HttpError("נדרש הקשר בניין", 400);
  }

  return prisma.apartment.findMany({
    where: { buildingId: currentUser.buildingId },
    skip,
    take: limit,
  });
};

export const getById = async (
  currentUser: SessionPayload,
  apartmentId: string,
) => {
  const apartment = await prisma.apartment.findUnique({
    where: { id: apartmentId },
  });

  if (!apartment) {
    throw new HttpError("הדירה לא נמצאה", 404);
  }

  await ensureAccess(currentUser, apartment.buildingId);

  return apartment;
};

export const update = async (
  currentUser: SessionPayload,
  apartmentId: string,
  data: UpdateApartmentCommand,
) => {
  const apartment = await prisma.apartment.findUnique({
    where: { id: apartmentId },
  });

  if (!apartment) {
    throw new HttpError("הדירה לא נמצאה", 404);
  }

  await ensureAccess(currentUser, apartment.buildingId);

  return prisma.apartment.update({
    where: { id: apartmentId },
    data,
  });
};

export const remove = async (
  currentUser: SessionPayload,
  apartmentId: string,
) => {
  const apartment = await prisma.apartment.findUnique({
    where: { id: apartmentId },
  });

  if (!apartment) {
    throw new HttpError("הדירה לא נמצאה", 404);
  }

  await ensureAccess(currentUser, apartment.buildingId);

  return prisma.apartment.delete({ where: { id: apartmentId } });
};

import prisma from "../lib/prisma";
import { HttpError } from "../utils/HttpError";
import { CreateManagerCommand } from "../validators/manager.validator";
import { PaginationOptions } from "../utils/pagination";

export const createManager = async (data: CreateManagerCommand) => {
  const building = await prisma.building.findUnique({
    where: { id: data.buildingId },
  });

  if (!building) throw new HttpError("הבניין לא נמצא", 404);

  return prisma.manager.create({
    data: {
      userId: data.userId,
      buildingId: data.buildingId,
    },
  });
};

export const getManagers = async (pagination: PaginationOptions = {}) => {
  const { limit, skip } = pagination;

  return prisma.manager.findMany({
    include: { user: true, building: true },
    skip,
    take: limit,
  });
};

export const getManagerById = async (managerId: string) => {
  const manager = await prisma.manager.findUnique({
    where: { id: managerId },
    include: { user: true, building: true },
  });

  if (!manager) throw new HttpError("המנהל לא נמצא", 404);

  return manager;
};

export const deleteManager = async (managerId: string) => {
  return prisma.manager.delete({ where: { id: managerId } });
};

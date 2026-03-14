import prisma from "../lib/prisma";
import { HttpError } from "../utils/HttpError";
import { CreateManagerCommand } from "../validators/manager.validator";

export const createManager = async (data: CreateManagerCommand) => {
  const building = await prisma.building.findUnique({
    where: { id: data.buildingId },
  });

  if (!building) throw new HttpError("Building not found", 404);

  return prisma.manager.create({
    data: {
      userId: data.userId,
      buildingId: data.buildingId,
    },
  });
};

export const getManagers = async () => {
  return prisma.manager.findMany({
    include: { user: true, building: true },
  });
};

export const getManagerById = async (managerId: string) => {
  const manager = await prisma.manager.findUnique({
    where: { id: managerId },
    include: { user: true, building: true },
  });

  if (!manager) throw new HttpError("Manager not found", 404);

  return manager;
};

export const deleteManager = async (managerId: string) => {
  return prisma.manager.delete({ where: { id: managerId } });
};

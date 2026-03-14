import prisma from "../lib/prisma";
import {
  CreateBuildingCommand,
  UpdateBuildingCommand,
} from "../validators/building.validator";

export const create = async (data: CreateBuildingCommand) => {
  return prisma.building.create({ data });
};

export const getAll = async () => {
  return prisma.building.findMany();
};

export const getById = async (id: string) => {
  return prisma.building.findUnique({ where: { id } });
};

export const update = async (id: string, data: UpdateBuildingCommand) => {
  return prisma.building.update({
    where: { id },
    data,
  });
};

export const remove = async (id: string) => {
  return prisma.building.delete({ where: { id } });
};

import prisma from "../lib/prisma";
import { CreateBuildingCommand } from "../validators/building.validator";

export const create = async (data: CreateBuildingCommand) => {
  return prisma.building.create({ data });
};

export const getAll = async () => {
  return prisma.building.findMany();
};

export const getById = async (id: string) => {
  return prisma.building.findUnique({ where: { id } });
};

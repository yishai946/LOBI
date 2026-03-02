import prisma from "../lib/prisma";
import { CreateBuildingCommand } from "../validators/building.validator";

export const create = async (data: CreateBuildingCommand) => {
  return prisma.building.create({ data });
};

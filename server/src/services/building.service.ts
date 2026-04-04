import prisma from "../lib/prisma";
import {
  CreateBuildingCommand,
  UpdateBuildingCommand,
} from "../validators/building.validator";
import { PaginationOptions } from "../utils/pagination";
import { HttpError } from "../utils/HttpError";

export const create = async (data: CreateBuildingCommand) => {
  return prisma.building.create({ data });
};

export const getAll = async (pagination: PaginationOptions = {}) => {
  const { limit, skip } = pagination;

  return prisma.building.findMany({
    skip,
    take: limit,
  });
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

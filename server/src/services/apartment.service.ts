import prisma from "../lib/prisma";
import { CreateApartmentCommand } from "../validators/apartment.validator";

export const create = async (data: CreateApartmentCommand) =>
  prisma.apartment.create({ data });

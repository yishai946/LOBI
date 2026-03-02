import prisma from "../lib/prisma";
import { HttpError } from "../utils/HttpError";
import { CreateApartmentCommand } from "../validators/apartment.validator";

export const create = async (data: CreateApartmentCommand) => {
  const existingApartment = await prisma.apartment.findFirst({
    where: {
      name: data.name,
      buildingId: data.buildingId,
    },
  });

  if (existingApartment) {
    throw new HttpError("Apartment name already exists in the building", 400);
  }

  return prisma.apartment.create({ data });
};

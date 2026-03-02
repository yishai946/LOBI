import { UserRole } from "../../generated/prisma/enums";
import { SessionType } from "../enums/sessionType.enum";
import {
  attachManager,
  attachResident,
  getOrCreateUser,
} from "../helpers/user.helper";
import prisma from "../lib/prisma";
import { SessionPayload } from "../types/auth";
import { HttpError } from "../utils/HttpError";
import {
  CreateManagerCommand,
  CreateResidentCommand,
} from "../validators/user.validator";

export const createResident = async (
  currentUser: SessionPayload,
  { phone, apartmentId }: CreateResidentCommand,
) => {
  const apartment = await prisma.apartment.findUnique({
    where: { id: apartmentId },
    select: { buildingId: true },
  });

  if (!apartment) throw new HttpError("Apartment not found", 404);

  if (
    currentUser.sessionType === SessionType.MANAGER &&
    currentUser.buildingId !== apartment.buildingId
  ) {
    throw new HttpError("Forbidden", 403);
  }

  const user = await getOrCreateUser(phone);

  return attachResident(user.id, apartmentId);
};

export const createManager = async ({
  phone,
  buildingId,
}: CreateManagerCommand) => {
  const building = await prisma.building.findUnique({
    where: { id: buildingId },
  });

  if (!building) {
    throw new HttpError("Building not found", 404);
  }

  const user = await getOrCreateUser(phone);

  return attachManager(user.id, buildingId);
};

import prisma from "../lib/prisma";

export const getOrCreateUser = async (phone: string) => {
  const existingUser = await prisma.user.findUnique({
    where: { phone },
  });

  if (existingUser) return existingUser;

  return prisma.user.create({
    data: { phone },
  });
};

export const attachResident = async (userId: string, apartmentId: string) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      apartments: {
        create: {
          apartment: {
            connect: { id: apartmentId },
          },
        },
      },
    },
  });
};


export const attachManager = async (userId: string, buildingId: string) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      manages: {
        create: {
          building: {
            connect: { id: buildingId },
          },
        },
      },
    },
  });
};


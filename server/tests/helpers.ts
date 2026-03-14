import jwt from "jsonwebtoken";
import prisma from "../src/lib/prisma";
import { SessionType } from "../src/enums/sessionType.enum";

export const signToken = (payload: {
  userId: string;
  sessionType: SessionType;
  buildingId?: string;
  apartmentId?: string;
}) => {
  return jwt.sign(payload, process.env.ACCESS_SECRET!, { expiresIn: "1h" });
};

const uniquePhone = () =>
  `05${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`;

export const seedCore = async () => {
  const admin = await prisma.user.create({
    data: {
      phone: uniquePhone(),
      name: "Admin",
      role: "ADMIN",
    },
  });

  const managerUser = await prisma.user.create({
    data: { phone: uniquePhone(), name: "Manager" },
  });

  const residentUser = await prisma.user.create({
    data: { phone: uniquePhone(), name: "Resident" },
  });

  const building = await prisma.building.create({
    data: { name: "Test Building", address: "Somewhere 1" },
  });

  const apartment = await prisma.apartment.create({
    data: { name: "Apt 1", buildingId: building.id },
  });

  const manager = await prisma.manager.create({
    data: { userId: managerUser.id, buildingId: building.id },
  });

  const resident = await prisma.resident.create({
    data: { userId: residentUser.id, apartmentId: apartment.id },
  });

  return {
    admin,
    managerUser,
    residentUser,
    building,
    apartment,
    manager,
    resident,
  };
};

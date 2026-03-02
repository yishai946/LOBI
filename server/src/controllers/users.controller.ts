import { Request, Response } from "express";
import { SessionType } from "../enums/sessionType.enum";
import * as userService from "../services/user.service";
import prisma from "../lib/prisma";
import { HttpError } from "../utils/HttpError";

export const createResident = async (req: Request, res: Response) => {
  const user = req.user;

  const apartment = await prisma.apartment.findUnique({
    where: { id: user.apartmentId },
    select: { buildingId: true },
  });

  if (user.sessionType === SessionType.MANAGER && user.buildingId !== apartment?.buildingId) {
    throw new HttpError("Forbidden", 403);
  }

  const resident = await prisma.user.create({
    data: {
      phone: req.body.phone,
      apartments: {
        connect: { userId_apartmentId: req.body.apartmentId },
      }
    }
  })

  return res.status(201).json({
    message: "Resident created successfully",
    resident,
  });
};

export const createManager = async (req: Request, res: Response) => {
  const manager = await userService.createManager(req.body);

  return res.status(201).json({
    message: "Manager created successfully",
    manager,
  });
};

import { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/HttpError";
import { SessionType } from "../enums/sessionType.enum";
import prisma from "../lib/prisma";

export const requireManager = (
  req: Request,
  _: Response,
  next: NextFunction,
) => {
  if (
    req.user.sessionType !== SessionType.MANAGER &&
    req.user.sessionType !== SessionType.ADMIN
  ) {
    return next(new HttpError("אסור: אינך מנהל", 403));
  }
  next();
};

export const requireAdmin = (req: Request, _: Response, next: NextFunction) => {
  if (req.user.sessionType !== SessionType.ADMIN) {
    return next(new HttpError("אסור: למנהלי מערכת בלבד", 403));
  }
  next();
};

export const requireBuildingAccess = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const user = req.user;
  const buildingId = req.params.id;

  if (user.sessionType === SessionType.ADMIN) return next();

  if (
    user.sessionType === SessionType.MANAGER &&
    user.buildingId === buildingId
  )
    return next();

  return res.status(403).json({ message: "Forbidden" });
};

export const requireApartmentAccess = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const user = req.user;
  const apartmentId = req.params.id;

  if (user.sessionType === SessionType.ADMIN) return next();

  const apartment = await prisma.apartment.findUnique({
    where: { id: apartmentId as string },
    select: { buildingId: true },
  });

  if (!apartment)
    return res.status(404).json({ message: "Apartment not found" });

  if (
    user.sessionType === SessionType.MANAGER &&
    user.buildingId === apartment.buildingId
  )
    return next();

  if (
    user.sessionType === SessionType.RESIDENT &&
    user.apartmentId === apartmentId
  )
    return next();

  return res.status(403).json({ message: "Forbidden" });
};

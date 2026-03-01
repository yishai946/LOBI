import { Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest } from "../middlewares/auth.middleware";
import { HttpError } from "../utils/HttpError";
import logger from "../utils/logger";
import { CreateResidentCommand } from "../validators/user.validator";

export const createResident = async (req: AuthRequest, res: Response) => {
  try {
    const admin = req.user;
    if (!admin) throw new HttpError("Unauthorized", 401);

    const { phone, apartmentId } = req.body as CreateResidentCommand;

    if (!phone || !apartmentId) {
      throw new HttpError("Phone and apartmentId are required", 400);
    }

    // Optional: check if admin has access to this apartment
    // const hasAccess = await prisma.apartment.findFirst({ ... });
    // if (!hasAccess) throw new HttpError("Not allowed to add residents to this apartment", 403);

    // Create resident
    const resident = await prisma.user.create({
      data: {
        phone,
        apartmentId,
        role: "RESIDENT", // optional, if you track roles
      },
    });

    logger.info({
      message: `Admin ${admin.userId} created resident ${resident.id}`,
      endpoint: "/api/users/resident",
    });

    return res.status(201).json({
      message: "Resident created successfully",
      resident,
    });
  } catch (err: any) {
    if (err.code === "P2002") {
      // Prisma unique constraint violation
      throw new HttpError("Phone number already exists", 400);
    }
    throw err;
  }
};

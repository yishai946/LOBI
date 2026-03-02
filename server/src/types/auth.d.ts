import { SessionPayload } from "./auth";
import { UserRole } from "../../generated/prisma/enums";
import { Request } from "express";

export interface SessionPayload {
  userId: string;
  sessionType: SessionType;
  buildingId?: string;
  apartmentId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user: SessionPayload;
    }
  }
}

import { SessionType } from "../enums/sessionType.enum";
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

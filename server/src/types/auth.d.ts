import { SessionType } from "../enums/sessionType.enum";
import { Request } from "express";

export type AccountTier = "FREE" | "PRO" | "ENTERPRISE";

export interface SessionPayload {
  userId: string;
  sessionType: SessionType;
  buildingId?: string;
  apartmentId?: string;
  accountId?: string;
  accountTier?: AccountTier;
}

declare global {
  namespace Express {
    interface Request {
      user: SessionPayload;
    }
  }
}

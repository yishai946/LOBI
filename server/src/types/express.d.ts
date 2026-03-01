import { UserRole } from "../../generated/prisma/enums";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: UserRole;
        apartmentId: string;
        buildingId: string;
      };
    }
  }
}

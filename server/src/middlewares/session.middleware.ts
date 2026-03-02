import { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/HttpError";
import { SessionType } from "../enums/sessionType.enum";

export const requireManager = (
  req: Request,
  _: Response,
  next: NextFunction,
) => {
  if (req.user.sessionType !== SessionType.MANAGER && req.user.sessionType !== SessionType.ADMIN) {
    return next(new HttpError("Forbidden: not a manager", 403));
  }
  next();
};

export const requireResident = (req: Request, _: Response, next: NextFunction) => {
  if (req.user.sessionType !== SessionType.RESIDENT && req.user.sessionType !== SessionType.ADMIN) {
    return next(new HttpError("Forbidden: not a resident", 403));
  }
  next();
};

export const requireAdmin = (req: Request, _: Response, next: NextFunction) => {
  if (req.user.sessionType !== SessionType.ADMIN) {
    return next(new HttpError("Forbidden: Admin only", 403));
  }
  next();
};

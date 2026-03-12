import { Response, NextFunction, Request } from "express";
import jwt from "jsonwebtoken";
import { SessionPayload } from "../types/auth";
import { HttpError } from "../utils/HttpError";

export const authMiddleware = (
  req: Request,
  _: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new HttpError("Unauthorized", 401);
    }

    const token = authHeader.split(" ")[1];

    const payload = jwt.verify(
      token,
      process.env.ACCESS_SECRET!,
    ) as SessionPayload;

    req.user = payload;

    next();
  } catch (err) {
    next(new HttpError("Unauthorized", 401));
  }
};

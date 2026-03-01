import { Request, Response, NextFunction } from "express";
import { ZodObject } from "zod";
import { HttpError } from "../utils/HttpError";

export const validate =
  (schema: ZodObject<any>) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err: any) {
      throw new HttpError(
        err.errors.map((e: any) => e.message).join(", "),
        400,
      );
    }
  };

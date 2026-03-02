import { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod";
import { HttpError } from "../utils/HttpError";

export const validate =
  (schema: ZodObject<any>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = await schema.parseAsync(req.body);

      req.body = validatedData;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join(", ");
        throw new HttpError(errorMessage, 400);
      }

      throw new HttpError("Internal Server Error", 500);
    }
  };

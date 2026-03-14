import { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/HttpError";
import logger from "../utils/logger";
import { Prisma } from "../../generated/prisma/client";

const isDev = process.env.NODE_ENV === "development";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  let statusCode = 500;
  let message = "Something went wrong. Please try again later.";

  if (err instanceof HttpError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2002"
  ) {
    statusCode = 400;
    message = "Resource already exists";
  }

  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2025"
  ) {
    statusCode = 404;
    message = "Resource not found";
  }

  logger.error({
    method: req.method,
    url: req.originalUrl,
    statusCode,
    message: err.message,
    stack: err.stack,
  });

  res.status(statusCode).json({
    message: isDev ? err.message : message,
  });
};

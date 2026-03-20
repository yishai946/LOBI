import { Request } from "express";
import { HttpError } from "./HttpError";

export interface PaginationOptions {
  limit?: number;
  skip?: number;
}

const parseIntegerQueryParam = (
  value: unknown,
  key: "limit" | "skip",
  min: number,
) => {
  if (value === undefined) {
    return undefined;
  }

  const normalized = Array.isArray(value) ? value[0] : value;

  if (typeof normalized !== "string" || normalized.trim() === "") {
    throw new HttpError(`פרמטר ${key} לא תקין`, 400);
  }

  const parsed = Number(normalized);

  if (!Number.isInteger(parsed) || parsed < min) {
    throw new HttpError(`פרמטר ${key} לא תקין`, 400);
  }

  return parsed;
};

export const parsePaginationQuery = (
  query: Request["query"],
): PaginationOptions => {
  const limit = parseIntegerQueryParam(query.limit, "limit", 1);
  const skip = parseIntegerQueryParam(query.skip, "skip", 0);

  return {
    ...(limit !== undefined ? { limit } : {}),
    ...(skip !== undefined ? { skip } : {}),
  };
};

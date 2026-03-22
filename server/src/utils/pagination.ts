import { Request } from "express";
import { HttpError } from "./HttpError";

export interface PaginationOptions {
  limit?: number;
  skip?: number;
}

export type SortOrder = "asc" | "desc";

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

const normalizeQueryValue = (
  value: unknown,
  key: string,
): string | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const normalized = Array.isArray(value) ? value[0] : value;

  if (typeof normalized !== "string") {
    throw new HttpError(`פרמטר ${key} לא תקין`, 400);
  }

  const trimmed = normalized.trim();
  if (!trimmed) {
    throw new HttpError(`פרמטר ${key} לא תקין`, 400);
  }

  return trimmed;
};

export const parseBooleanQueryParam = (
  value: unknown,
  key: string,
): boolean | undefined => {
  const normalized = normalizeQueryValue(value, key);
  if (normalized === undefined) {
    return undefined;
  }

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  throw new HttpError(`פרמטר ${key} לא תקין`, 400);
};

export const parseEnumQueryParam = <T extends string>(
  value: unknown,
  key: string,
  allowedValues: readonly T[],
): T | undefined => {
  const normalized = normalizeQueryValue(value, key);
  if (normalized === undefined) {
    return undefined;
  }

  if ((allowedValues as readonly string[]).includes(normalized)) {
    return normalized as T;
  }

  throw new HttpError(`פרמטר ${key} לא תקין`, 400);
};

export const parseSortOrderQuery = (
  value: unknown,
  key = "sort",
): SortOrder | undefined => {
  const normalized = normalizeQueryValue(value, key);
  if (normalized === undefined) {
    return undefined;
  }

  if (normalized === "new" || normalized === "desc") {
    return "desc";
  }

  if (normalized === "old" || normalized === "asc") {
    return "asc";
  }

  throw new HttpError(`פרמטר ${key} לא תקין`, 400);
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

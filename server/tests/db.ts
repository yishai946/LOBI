import prisma from "../src/lib/prisma";

export const resetDb = async () => {
  // No-op: avoid destructive cleanup on shared test databases.
};

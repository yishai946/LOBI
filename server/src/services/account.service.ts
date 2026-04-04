import prisma from "../lib/prisma";
import { SessionPayload } from "../types/auth";
import { HttpError } from "../utils/HttpError";

const BUILDING_LIMITS_BY_TIER: Record<string, number | null> = {
  FREE: 1,
  PRO: 5,
  ENTERPRISE: null, // Unlimited
};

/**
 * Create a new account for a user.
 * Used when a manager creates their first building.
 */
export const createAccount = async (
  userId: string,
  accountName: string,
  tier: "FREE" | "PRO" | "ENTERPRISE" = "FREE",
) => {
  const account = await prisma.account.create({
    data: {
      name: accountName,
      tier,
      ownerId: userId,
    },
  });

  // Link the user to the account
  await prisma.user.update({
    where: { id: userId },
    data: { accountId: account.id },
  });

  return account;
};

/**
 * Get the current user's account with metadata
 */
export const getMyAccount = async (currentUser: SessionPayload) => {
  if (!currentUser.accountId) {
    throw new HttpError("אינך חלק מחשבון", 400);
  }

  const account = await prisma.account.findUnique({
    where: { id: currentUser.accountId },
    include: {
      buildings: {
        select: {
          id: true,
          name: true,
          address: true,
        },
      },
    },
  });

  if (!account) {
    throw new HttpError("החשבון לא נמצא", 404);
  }

  if (account.ownerId !== currentUser.userId) {
    throw new HttpError("אינך בעלים של החשבון", 403);
  }

  const buildingCount = account.buildings.length;
  const buildingLimit = BUILDING_LIMITS_BY_TIER[account.tier];

  return {
    ...account,
    buildingCount,
    buildingLimit,
    canAddBuilding: buildingLimit === null || buildingCount < buildingLimit,
  };
};

/**
 * Check if a user can add a new building based on account tier
 */
export const checkBuildingLimitForAccount = async (accountId: string) => {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    include: { buildings: { select: { id: true } } },
  });

  if (!account) {
    throw new HttpError("החשבון לא נמצא", 404);
  }

  const limit = BUILDING_LIMITS_BY_TIER[account.tier];
  const count = account.buildings.length;

  if (limit !== null && count >= limit) {
    throw new HttpError(
      `הגעת להגבלת הבניינים עבור תוכנית ${account.tier}. משדרגים ל-PRO כדי להוסיף עוד בניינים.`,
      403,
    );
  }

  return { canAdd: true, currentCount: count, limit };
};

/**
 * Upgrade an account tier (only owner can do this)
 */
export const upgradeAccountTier = async (
  currentUser: SessionPayload,
  newTier: "PRO" | "ENTERPRISE",
) => {
  if (!currentUser.accountId) {
    throw new HttpError("אינך חלק מחשבון", 400);
  }

  const account = await prisma.account.findUnique({
    where: { id: currentUser.accountId },
  });

  if (!account) {
    throw new HttpError("החשבון לא נמצא", 404);
  }

  if (account.ownerId !== currentUser.userId) {
    throw new HttpError("רק בעל החשבון יכול לשדרג", 403);
  }

  const updatedAccount = await prisma.account.update({
    where: { id: currentUser.accountId },
    data: { tier: newTier },
  });

  return updatedAccount;
};

/**
 * Get tier for a building (via its account)
 */
export const getBuildingAccountTier = async (buildingId: string) => {
  const building = await prisma.building.findUnique({
    where: { id: buildingId },
    select: { account: { select: { tier: true } } },
  });

  if (!building) {
    throw new HttpError("הבניין לא נמצא", 404);
  }

  return building.account.tier;
};

/**
 * Validate that the calling user owns the account associated with a building
 */
export const ensureBuildingAccountAccess = async (
  currentUser: SessionPayload,
  buildingId: string,
) => {
  const building = await prisma.building.findUnique({
    where: { id: buildingId },
    select: { accountId: true },
  });

  if (!building) {
    throw new HttpError("הבניין לא נמצא", 404);
  }

  if (currentUser.accountId !== building.accountId) {
    throw new HttpError("אינך בעל גישה לבניין זה", 403);
  }
};

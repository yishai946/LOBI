import { SessionPayload } from "../types/auth";
import { HttpError } from "../utils/HttpError";

/**
 * Account service is temporarily disabled during schema refactoring
 * These functions will be re-implemented when Account model is re-introduced
 * for multi-tenancy support.
 */

/**
 * Building limits by tier
 * FREE: 1 building
 * PRO: 5 buildings
 * ENTERPRISE: Unlimited
 */
export const BUILDING_LIMITS_BY_TIER: Record<
  "FREE" | "PRO" | "ENTERPRISE",
  number | null
> = {
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
  throw new HttpError("Account service is temporarily disabled", 501);
};

/**
 * Get the current user's account with metadata
 */
export const getMyAccount = async (currentUser: SessionPayload) => {
  throw new HttpError("Account service is temporarily disabled", 501);
};

/**
 * Check if a user can add a new building based on account tier
 */
export const checkBuildingLimitForAccount = async (accountId: string) => {
  throw new HttpError("Account service is temporarily disabled", 501);
};

/**
 * Upgrade an account tier (only owner can do this)
 */
export const upgradeAccountTier = async (
  currentUser: SessionPayload,
  newTier: "PRO" | "ENTERPRISE",
) => {
  throw new HttpError("Account service is temporarily disabled", 501);
};

/**
 * Get tier for a building (via its account)
 */
export const getBuildingAccountTier = async (buildingId: string) => {
  // Return FREE tier for all buildings temporarily
  return "FREE";
};

/**
 * Validate that the calling user owns the account associated with a building
 */
export const ensureBuildingAccountAccess = async (
  currentUser: SessionPayload,
  buildingId: string,
) => {
  // Temporarily allow access for all users
  return;
};

import prisma from "../lib/prisma";
import { HttpError } from "../utils/HttpError";
import { SessionPayload } from "../types/auth";
import { SessionType } from "../enums/sessionType.enum";
import { UpgradeFeature } from "../../generated/prisma/enums";
import { UpgradeRequestCommand } from "../validators/upgradeRequest.validator";
import { upsertDailyUpgradeRequestNotifications } from "./notification.service";
import { getBuildingAccountTier } from "./account.service";

const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;

const resolveBuildingId = (
  currentUser: SessionPayload,
  buildingId?: string,
) => {
  if (currentUser.sessionType === SessionType.ADMIN) {
    if (!buildingId) {
      throw new HttpError("נדרש מזהה בניין", 400);
    }
    return buildingId;
  }

  if (!currentUser.buildingId) {
    throw new HttpError("נדרש הקשר בניין", 400);
  }

  return currentUser.buildingId;
};

export const createUpgradeRequest = async (
  currentUser: SessionPayload,
  data: UpgradeRequestCommand,
) => {
  if (currentUser.sessionType !== SessionType.RESIDENT) {
    throw new HttpError("אסור", 403);
  }

  if (!currentUser.buildingId) {
    throw new HttpError("נדרש הקשר בניין", 400);
  }

  const accountTier = await getBuildingAccountTier(currentUser.buildingId);

  if (accountTier !== "FREE") {
    throw new HttpError("הבניין כבר בתכנית בתשלום", 400);
  }

  const now = new Date();
  const minAllowed = new Date(now.getTime() - THIRTY_DAYS_MS);

  const existing = await prisma.upgradeRequest.findUnique({
    where: {
      buildingId_residentId_featureRequested: {
        buildingId: currentUser.buildingId,
        residentId: currentUser.userId,
        featureRequested: data.featureRequested as UpgradeFeature,
      },
    },
  });

  if (existing && existing.createdAt > minAllowed) {
    throw new HttpError("ניתן לשלוח בקשה פעם ב-30 יום", 429);
  }

  const request = existing
    ? await prisma.upgradeRequest.update({
        where: { id: existing.id },
        data: { createdAt: now },
      })
    : await prisma.upgradeRequest.create({
        data: {
          buildingId: currentUser.buildingId,
          residentId: currentUser.userId,
          featureRequested: data.featureRequested as UpgradeFeature,
        },
      });

  const totalRequests = await prisma.upgradeRequest.count({
    where: {
      buildingId: currentUser.buildingId,
      featureRequested: data.featureRequested as UpgradeFeature,
    },
  });

  await upsertDailyUpgradeRequestNotifications(
    currentUser.buildingId,
    totalRequests,
  );

  return { request, totalRequests };
};

export const getUpgradeRequestSummary = async (
  currentUser: SessionPayload,
  buildingId?: string,
) => {
  const targetBuildingId = resolveBuildingId(currentUser, buildingId);

  const totalRequests = await prisma.upgradeRequest.count({
    where: {
      buildingId: targetBuildingId,
      featureRequested: UpgradeFeature.DIGITAL_PAYMENTS,
    },
  });

  return {
    buildingId: targetBuildingId,
    totalRequests,
  };
};

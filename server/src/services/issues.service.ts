import prisma from "../lib/prisma";
import { HttpError } from "../utils/HttpError";
import { SessionPayload } from "../types/auth";
import { SessionType } from "../enums/sessionType.enum";
import {
  CreateIssueCommand,
  UpdateIssueCommand,
  UploadUrlsCommand,
} from "../validators/issue.validator";
import { generateUploadUrls } from "./s3.service";

const MAX_IMAGES = 3;

const ensureResidentContext = (currentUser: SessionPayload) => {
  if (currentUser.sessionType !== SessionType.RESIDENT) {
    throw new HttpError("אסור", 403);
  }

  if (!currentUser.buildingId || !currentUser.apartmentId) {
    throw new HttpError("נדרש הקשר בניין ודירה", 400);
  }

  return {
    buildingId: currentUser.buildingId,
    apartmentId: currentUser.apartmentId,
  };
};

const isValidKey = (key: string, buildingId: string, apartmentId: string) => {
  const prefix = `issues/${buildingId}/${apartmentId}/`;
  if (!key.startsWith(prefix)) return false;

  const suffix = key.slice(prefix.length);
  return /^[0-9a-fA-F-]{36}\.[A-Za-z0-9]+$/.test(suffix);
};

export const createUploadUrls = async (
  currentUser: SessionPayload,
  data: UploadUrlsCommand,
) => {
  const { buildingId, apartmentId } = ensureResidentContext(currentUser);

  if (data.files.length > MAX_IMAGES) {
    throw new HttpError("מקסימום 3 קבצים", 400);
  }

  try {
    const uploads = await generateUploadUrls(
      data.files,
      buildingId,
      apartmentId,
    );

    return { uploads };
  } catch (error) {
    throw new HttpError("שגיאה ביצירת כתובות העלאה", 400);
  }
};

export const createIssue = async (
  currentUser: SessionPayload,
  data: CreateIssueCommand,
) => {
  let buildingId = currentUser.buildingId;
  let apartmentId = currentUser.apartmentId;

  if (currentUser.sessionType === SessionType.RESIDENT) {
    const context = ensureResidentContext(currentUser);
    buildingId = context.buildingId;
    apartmentId = context.apartmentId;
  } else if (currentUser.sessionType === SessionType.MANAGER) {
    if (!currentUser.buildingId) {
      throw new HttpError("נדרש הקשר בניין", 400);
    }

    if (!data.apartmentId) {
      throw new HttpError("נדרש מזהה דירה", 400);
    }

    const apartment = await prisma.apartment.findUnique({
      where: { id: data.apartmentId },
      select: { buildingId: true },
    });

    if (!apartment) throw new HttpError("הדירה לא נמצאה", 404);

    if (apartment.buildingId !== currentUser.buildingId) {
      throw new HttpError("אסור", 403);
    }

    buildingId = apartment.buildingId;
    apartmentId = data.apartmentId;
  } else if (currentUser.sessionType === SessionType.ADMIN) {
    if (!data.apartmentId) {
      throw new HttpError("נדרש מזהה דירה", 400);
    }

    const apartment = await prisma.apartment.findUnique({
      where: { id: data.apartmentId },
      select: { buildingId: true },
    });

    if (!apartment) throw new HttpError("הדירה לא נמצאה", 404);

    buildingId = apartment.buildingId;
    apartmentId = data.apartmentId;
  } else {
    throw new HttpError("אסור", 403);
  }

  const imageKeys = data.imageKeys ?? [];

  if (imageKeys.length > MAX_IMAGES) {
    throw new HttpError("מקסימום 3 תמונות", 400);
  }

  for (const key of imageKeys) {
    if (!key.startsWith("issues/")) {
      throw new HttpError("מפתח תמונה לא תקין", 400);
    }
    if (!buildingId || !apartmentId) {
      throw new HttpError("נדרש הקשר בניין ודירה", 400);
    }
    if (!isValidKey(key, buildingId, apartmentId)) {
      throw new HttpError("מפתח התמונה אינו תואם לבניין/דירה", 400);
    }
  }

  const issue = await prisma.issue.create({
    data: {
      title: data.title,
      description: data.description,
      createdById: currentUser.userId,
      buildingId: buildingId!,
      apartmentId: apartmentId!,
    },
  });

  if (imageKeys.length > 0) {
    await prisma.issueImage.createMany({
      data: imageKeys.map((imageKey) => ({
        issueId: issue.id,
        imageKey,
      })),
    });
  }

  return issue;
};

export const getIssues = async (currentUser: SessionPayload) => {
  if (currentUser.sessionType === SessionType.ADMIN) {
    return prisma.issue.findMany({
      include: { images: true },
      orderBy: { createdAt: "desc" },
    });
  }

  if (!currentUser.buildingId) {
    throw new HttpError("נדרש הקשר בניין", 400);
  }

  return prisma.issue.findMany({
    where: { buildingId: currentUser.buildingId },
    include: { images: true },
    orderBy: { createdAt: "desc" },
  });
};

export const getIssueById = async (
  currentUser: SessionPayload,
  issueId: string,
) => {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: { images: true },
  });

  if (!issue) throw new HttpError("הבעיה לא נמצאה", 404);

  if (currentUser.sessionType === SessionType.ADMIN) return issue;

  if (issue.buildingId !== currentUser.buildingId) {
    throw new HttpError("אסור", 403);
  }

  return issue;
};

export const updateIssue = async (
  currentUser: SessionPayload,
  issueId: string,
  data: UpdateIssueCommand,
) => {
  if (!data.title && !data.description) {
    throw new HttpError("לא סופקו עדכונים", 400);
  }

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
  });

  if (!issue) throw new HttpError("הבעיה לא נמצאה", 404);

  if (currentUser.sessionType === SessionType.ADMIN) {
    return prisma.issue.update({
      where: { id: issueId },
      data,
    });
  }

  if (issue.buildingId !== currentUser.buildingId) {
    throw new HttpError("אסור", 403);
  }

  if (
    currentUser.sessionType === SessionType.RESIDENT &&
    issue.createdById !== currentUser.userId
  ) {
    throw new HttpError("אסור", 403);
  }

  return prisma.issue.update({
    where: { id: issueId },
    data,
  });
};

export const deleteIssue = async (
  currentUser: SessionPayload,
  issueId: string,
) => {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
  });

  if (!issue) throw new HttpError("הבעיה לא נמצאה", 404);

  if (currentUser.sessionType === SessionType.ADMIN) {
    return prisma.issue.delete({ where: { id: issueId } });
  }

  if (issue.buildingId !== currentUser.buildingId) {
    throw new HttpError("אסור", 403);
  }

  if (
    currentUser.sessionType === SessionType.RESIDENT &&
    issue.createdById !== currentUser.userId
  ) {
    throw new HttpError("אסור", 403);
  }

  return prisma.issue.delete({ where: { id: issueId } });
};

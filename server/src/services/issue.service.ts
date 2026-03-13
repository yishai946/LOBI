import { randomUUID } from "crypto";
import prisma from "../lib/prisma";
import { HttpError } from "../utils/HttpError";
import { getPresignedUploadUrl } from "./s3.service";
import {
  CreateIssueCommand,
  IssueUploadUrlCommand,
  UpdateIssueCommand,
} from "../validators/issue.validator";
import { SessionPayload } from "../types/auth";
import { SessionType } from "../enums/sessionType.enum";

const MAX_IMAGES_PER_ISSUE = 3;

const sanitizeFileName = (fileName: string) =>
  fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

const buildIssueImageKey = (issueId: string, fileName: string) => {
  const safeName = sanitizeFileName(fileName);
  return `issues/${issueId}/${randomUUID()}-${safeName}`;
};

export const createIssue = async (
  currentUser: SessionPayload,
  data: CreateIssueCommand,
) => {
  if (currentUser.sessionType !== SessionType.RESIDENT) {
    throw new HttpError("Forbidden", 403);
  }

  if (!currentUser.buildingId) {
    throw new HttpError("Building context required", 400);
  }

  const imageInputs = data.images ?? [];

  if (imageInputs.length > MAX_IMAGES_PER_ISSUE) {
    throw new HttpError("Maximum 3 images per issue", 400);
  }

  const issue = await prisma.issue.create({
    data: {
      buildingId: currentUser.buildingId,
      createdById: currentUser.userId,
      location: data.location,
      category: data.category,
      description: data.description,
    },
  });

  const uploads: Array<{ key: string; uploadUrl: string; imageUrl: string }> =
    [];

  for (const image of imageInputs) {
    const key = buildIssueImageKey(issue.id, image.fileName);
    const { uploadUrl, imageUrl } = await getPresignedUploadUrl(
      key,
      image.contentType,
    );

    await prisma.issueImage.create({
      data: {
        issueId: issue.id,
        imageKey: key,
        imageUrl,
      },
    });

    uploads.push({ key, uploadUrl, imageUrl });
  }

  return { issue, uploads };
};

export const getMyIssues = async (currentUser: SessionPayload) => {
  if (currentUser.sessionType !== SessionType.RESIDENT) {
    throw new HttpError("Forbidden", 403);
  }

  return prisma.issue.findMany({
    where: { createdById: currentUser.userId },
    include: { images: true },
    orderBy: { createdAt: "desc" },
  });
};

export const getIssues = async (
  currentUser: SessionPayload,
  buildingId?: string,
) => {
  if (currentUser.sessionType === SessionType.MANAGER) {
    if (!currentUser.buildingId) {
      throw new HttpError("Building context required", 400);
    }

    return prisma.issue.findMany({
      where: { buildingId: currentUser.buildingId },
      include: { images: true },
      orderBy: { createdAt: "desc" },
    });
  }

  if (currentUser.sessionType === SessionType.ADMIN) {
    return prisma.issue.findMany({
      where: buildingId ? { buildingId } : undefined,
      include: { images: true },
      orderBy: { createdAt: "desc" },
    });
  }

  throw new HttpError("Forbidden", 403);
};

export const updateIssue = async (
  currentUser: SessionPayload,
  issueId: string,
  data: UpdateIssueCommand,
) => {
  if (currentUser.sessionType === SessionType.RESIDENT) {
    throw new HttpError("Forbidden", 403);
  }

  if (!data.status && !data.adminComment) {
    throw new HttpError("No updates provided", 400);
  }

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { id: true, buildingId: true },
  });

  if (!issue) {
    throw new HttpError("Issue not found", 404);
  }

  if (
    currentUser.sessionType === SessionType.MANAGER &&
    currentUser.buildingId !== issue.buildingId
  ) {
    throw new HttpError("Forbidden", 403);
  }

  return prisma.issue.update({
    where: { id: issueId },
    data: {
      status: data.status,
      adminComment: data.adminComment,
    },
  });
};

export const createIssueImageUpload = async (
  currentUser: SessionPayload,
  { issueId, fileName, contentType }: IssueUploadUrlCommand,
) => {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { id: true, createdById: true, buildingId: true },
  });

  if (!issue) {
    throw new HttpError("Issue not found", 404);
  }

  if (currentUser.sessionType !== SessionType.ADMIN) {
    if (currentUser.sessionType === SessionType.RESIDENT) {
      if (issue.createdById !== currentUser.userId) {
        throw new HttpError("Forbidden", 403);
      }
    }

    if (currentUser.sessionType === SessionType.MANAGER) {
      if (currentUser.buildingId !== issue.buildingId) {
        throw new HttpError("Forbidden", 403);
      }
    }
  }

  const existingCount = await prisma.issueImage.count({
    where: { issueId },
  });

  if (existingCount >= MAX_IMAGES_PER_ISSUE) {
    throw new HttpError("Maximum 3 images per issue", 400);
  }

  const key = buildIssueImageKey(issueId, fileName);

  const { uploadUrl, imageUrl } = await getPresignedUploadUrl(
    key,
    contentType,
  );

  await prisma.issueImage.create({
    data: {
      issueId,
      imageKey: key,
      imageUrl,
    },
  });

  return { uploadUrl, key, imageUrl };
};

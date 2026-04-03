import prisma from "../lib/prisma";
import { HttpError } from "../utils/HttpError";
import { SessionPayload } from "../types/auth";
import { SessionType } from "../enums/sessionType.enum";
import { IssueStatus } from "../enums/issueStatus.enum";
import {
  CreateIssueCommand,
  UpdateIssueCommand,
  UploadUrlsCommand,
} from "../validators/issue.validator";
import { generateUploadUrls, generateViewUrl } from "./s3.service";
import { PaginationOptions, SortOrder } from "../utils/pagination";
import { notifyIssueStatusChanged } from "./notification.service";

interface IssueQueryOptions {
  status?: IssueStatus;
  sortByCreatedAt?: SortOrder;
}

const MAX_IMAGES = 3;

const getNextIssueStatus = (status: IssueStatus): IssueStatus | null => {
  switch (status) {
    case IssueStatus.OPEN:
      return IssueStatus.IN_PROGRESS;
    case IssueStatus.IN_PROGRESS:
      return IssueStatus.DONE;
    case IssueStatus.DONE:
      return null;
    default:
      return null;
  }
};

const getPreviousIssueStatus = (status: IssueStatus): IssueStatus | null => {
  switch (status) {
    case IssueStatus.OPEN:
      return null;
    case IssueStatus.IN_PROGRESS:
      return IssueStatus.OPEN;
    case IssueStatus.DONE:
      return IssueStatus.IN_PROGRESS;
    default:
      return null;
  }
};

const buildStatusTimestamps = (
  status: IssueStatus,
  now: Date,
  current?: { openedAt: Date; inProgressAt: Date | null; doneAt: Date | null },
) => {
  const openedAt = current?.openedAt ?? now;
  const inProgressAt = current?.inProgressAt ?? null;
  const doneAt = current?.doneAt ?? null;

  if (status === IssueStatus.OPEN) {
    return {
      openedAt,
      inProgressAt: null,
      doneAt: null,
    };
  }

  if (status === IssueStatus.IN_PROGRESS) {
    return {
      openedAt,
      inProgressAt: inProgressAt ?? now,
      doneAt: null,
    };
  }

  return {
    openedAt,
    inProgressAt: inProgressAt ?? now,
    doneAt: doneAt ?? now,
  };
};

const resolveScopedBuildingId = (currentUser: SessionPayload): string => {
  if (currentUser.sessionType === SessionType.ADMIN) {
    if (!currentUser.buildingId) {
      throw new HttpError("נדרש הקשר בניין עבור הפעולה", 400);
    }

    return currentUser.buildingId;
  }

  if (
    currentUser.sessionType !== SessionType.MANAGER &&
    currentUser.sessionType !== SessionType.RESIDENT
  ) {
    throw new HttpError("אסור", 403);
  }

  if (!currentUser.buildingId) {
    throw new HttpError("נדרש הקשר בניין", 400);
  }

  return currentUser.buildingId;
};

const isSameCreatorContext = (
  currentUser: SessionPayload,
  createdById: string,
  createdByContextType: "MANAGER" | "RESIDENT" | "ADMIN" | null,
): boolean => {
  return (
    createdById === currentUser.userId &&
    createdByContextType !== null &&
    createdByContextType === currentUser.sessionType
  );
};

const getCreatorContextType = (
  sessionType: SessionType,
): "MANAGER" | "RESIDENT" | "ADMIN" => {
  if (sessionType === SessionType.MANAGER) {
    return "MANAGER";
  }

  if (sessionType === SessionType.RESIDENT) {
    return "RESIDENT";
  }

  return "ADMIN";
};

const isValidKey = (key: string, buildingId: string) => {
  const prefix = `issues/${buildingId}/`;
  if (!key.startsWith(prefix)) return false;

  const suffix = key.slice(prefix.length);
  return /^[0-9a-fA-F-]{36}\.[A-Za-z0-9]+$/.test(suffix);
};

type IssueImageRecord = {
  id: string;
  issueId: string;
  imageKey: string;
  createdAt: Date;
};

type IssueCreator = {
  id: string;
  name: string | null;
  role: string;
};

type IssueWithImages<TImage = IssueImageRecord> = {
  images: TImage[];
};

type IssueWithCreator<TImage = IssueImageRecord> = IssueWithImages<TImage> & {
  createdByContextType: SessionType | null;
  createdBy?: IssueCreator | null;
};

const mapIssueImagesToSignedUrls = async <TIssue extends IssueWithImages>(
  issue: TIssue,
) => {
  const images = await Promise.all(
    issue.images.map(async (image) => ({
      id: image.id,
      issueId: image.issueId,
      createdAt: image.createdAt,
      imageUrl: await generateViewUrl(image.imageKey),
    })),
  );

  const issueWithCreator = issue as TIssue & Partial<IssueWithCreator>;

  if (issueWithCreator.createdBy) {
    return {
      ...issue,
      createdBy: {
        ...issueWithCreator.createdBy,
        contextType: issueWithCreator.createdByContextType ?? undefined,
      },
      images,
    };
  }

  return {
    ...issue,
    images,
  };
};

export const createUploadUrls = async (
  currentUser: SessionPayload,
  data: UploadUrlsCommand,
) => {
  const buildingId = resolveScopedBuildingId(currentUser);

  if (data.files.length > MAX_IMAGES) {
    throw new HttpError(`מקסימום ${MAX_IMAGES} קבצים`, 400);
  }

  try {
    const uploads = await generateUploadUrls(data.files, buildingId);

    return { uploads };
  } catch (error) {
    throw new HttpError("שגיאה ביצירת כתובות העלאה", 400);
  }
};

export const createIssue = async (
  currentUser: SessionPayload,
  data: CreateIssueCommand,
) => {
  const buildingId = resolveScopedBuildingId(currentUser);

  const imageKeys = data.imageKeys ?? [];

  if (imageKeys.length > MAX_IMAGES) {
    throw new HttpError("מקסימום 3 תמונות", 400);
  }

  for (const key of imageKeys) {
    if (!key.startsWith("issues/")) {
      throw new HttpError("מפתח תמונה לא תקין", 400);
    }

    if (!isValidKey(key, buildingId)) {
      throw new HttpError("מפתח התמונה אינו תואם לבניין", 400);
    }
  }

  const issueStatus = data.status ?? IssueStatus.OPEN;
  const now = new Date();
  const statusTimestamps = buildStatusTimestamps(issueStatus, now);

  const issue = await prisma.issue.create({
    data: {
      title: data.title,
      description: data.description,
      isUrgent: data.isUrgent ?? false,
      status: issueStatus,
      ...statusTimestamps,
      createdById: currentUser.userId,
      createdByContextType: getCreatorContextType(currentUser.sessionType),
      buildingId,
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

export const getIssues = async (
  currentUser: SessionPayload,
  pagination: PaginationOptions = {},
  queryOptions: IssueQueryOptions = {},
) => {
  const { limit, skip } = pagination;
  const { status, sortByCreatedAt = "desc" } = queryOptions;

  const query = {
    include: {
      images: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: sortByCreatedAt },
    skip,
    take: limit,
  };

  if (currentUser.sessionType === SessionType.ADMIN) {
    const issues = await prisma.issue.findMany({
      where: {
        ...(status ? { status } : {}),
      },
      ...query,
    });
    return Promise.all(issues.map(mapIssueImagesToSignedUrls));
  }

  if (!currentUser.buildingId) {
    throw new HttpError("נדרש הקשר בניין", 400);
  }

  const issues = await prisma.issue.findMany({
    where: {
      buildingId: currentUser.buildingId,
      ...(status ? { status } : {}),
    },
    ...query,
  });

  return Promise.all(issues.map(mapIssueImagesToSignedUrls));
};

export const getIssueById = async (
  currentUser: SessionPayload,
  issueId: string,
) => {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: {
      images: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });

  if (!issue) throw new HttpError("הבעיה לא נמצאה", 404);

  if (currentUser.sessionType === SessionType.ADMIN) {
    return mapIssueImagesToSignedUrls(issue);
  }

  if (issue.buildingId !== currentUser.buildingId) {
    throw new HttpError("אסור", 403);
  }

  return mapIssueImagesToSignedUrls(issue);
};

export const updateIssue = async (
  currentUser: SessionPayload,
  issueId: string,
  data: UpdateIssueCommand,
) => {
  if (
    !data.title &&
    !data.description &&
    data.isUrgent === undefined &&
    !data.status
  ) {
    throw new HttpError("לא סופקו עדכונים", 400);
  }

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: {
      id: true,
      buildingId: true,
      createdById: true,
      createdByContextType: true,
      isUrgent: true,
      openedAt: true,
      inProgressAt: true,
      doneAt: true,
    },
  });

  if (!issue) throw new HttpError("הבעיה לא נמצאה", 404);

  const statusUpdateData = data.status
    ? buildStatusTimestamps(data.status, new Date(), {
        openedAt: issue.openedAt,
        inProgressAt: issue.inProgressAt,
        doneAt: issue.doneAt,
      })
    : {};

  const updateData = {
    ...data,
    ...statusUpdateData,
  };

  if (currentUser.sessionType === SessionType.ADMIN) {
    return prisma.issue.update({
      where: { id: issueId },
      data: updateData,
    });
  }

  if (issue.buildingId !== currentUser.buildingId) {
    throw new HttpError("אסור", 403);
  }

  const isManager = currentUser.sessionType === SessionType.MANAGER;
  const isIssueCreator = isSameCreatorContext(
    currentUser,
    issue.createdById,
    issue.createdByContextType,
  );

  if (!isManager && !isIssueCreator) {
    throw new HttpError("אסור", 403);
  }

  return prisma.issue.update({
    where: { id: issueId },
    data: updateData,
  });
};

export const moveIssueToNextStatus = async (
  currentUser: SessionPayload,
  issueId: string,
) => {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: { images: true },
  });

  if (!issue) {
    throw new HttpError("הבעיה לא נמצאה", 404);
  }

  if (currentUser.sessionType !== SessionType.ADMIN) {
    if (issue.buildingId !== currentUser.buildingId) {
      throw new HttpError("אסור", 403);
    }
  }

  const nextStatus = getNextIssueStatus(issue.status as IssueStatus);
  if (!nextStatus) {
    throw new HttpError("התקלה כבר סומנה כטופלה", 400);
  }

  const statusTimestamps = buildStatusTimestamps(nextStatus, new Date(), {
    openedAt: issue.openedAt,
    inProgressAt: issue.inProgressAt,
    doneAt: issue.doneAt,
  });

  const updatedIssue = await prisma.issue.update({
    where: { id: issueId },
    data: {
      status: nextStatus,
      ...statusTimestamps,
    },
    include: { images: true },
  });

  // Fire-and-forget notification
  notifyIssueStatusChanged(
    issue.buildingId,
    currentUser.userId,
    issue.createdById,
    issue.id,
    issue.title,
    nextStatus,
  );

  return mapIssueImagesToSignedUrls(updatedIssue);
};

export const moveIssueToPreviousStatus = async (
  currentUser: SessionPayload,
  issueId: string,
) => {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: { images: true },
  });

  if (!issue) {
    throw new HttpError("הבעיה לא נמצאה", 404);
  }

  if (currentUser.sessionType !== SessionType.ADMIN) {
    if (issue.buildingId !== currentUser.buildingId) {
      throw new HttpError("אסור", 403);
    }
  }

  const previousStatus = getPreviousIssueStatus(issue.status as IssueStatus);
  if (!previousStatus) {
    throw new HttpError("התקלה כבר בשלב הראשון", 400);
  }

  const statusTimestamps = buildStatusTimestamps(previousStatus, new Date(), {
    openedAt: issue.openedAt,
    inProgressAt: issue.inProgressAt,
    doneAt: issue.doneAt,
  });

  const updatedIssue = await prisma.issue.update({
    where: { id: issueId },
    data: {
      status: previousStatus,
      ...statusTimestamps,
    },
    include: { images: true },
  });

  // Fire-and-forget notification
  notifyIssueStatusChanged(
    issue.buildingId,
    currentUser.userId,
    issue.createdById,
    issue.id,
    issue.title,
    previousStatus,
  );

  return mapIssueImagesToSignedUrls(updatedIssue);
};

export const deleteIssue = async (
  currentUser: SessionPayload,
  issueId: string,
) => {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: {
      id: true,
      buildingId: true,
      createdById: true,
      createdByContextType: true,
    },
  });

  if (!issue) throw new HttpError("הבעיה לא נמצאה", 404);

  if (currentUser.sessionType === SessionType.ADMIN) {
    return prisma.issue.delete({ where: { id: issueId } });
  }

  if (issue.buildingId !== currentUser.buildingId) {
    throw new HttpError("אסור", 403);
  }

  if (currentUser.sessionType === SessionType.MANAGER) {
    return prisma.issue.delete({ where: { id: issueId } });
  }

  const isIssueCreator = isSameCreatorContext(
    currentUser,
    issue.createdById,
    issue.createdByContextType,
  );

  if (!isIssueCreator) {
    throw new HttpError("אסור", 403);
  }

  return prisma.issue.delete({ where: { id: issueId } });
};

import { IssueStatus } from '@enums/IssueStatus';
import { AxiosError } from 'axios';

const HOUR_IN_MS = 60 * 60 * 1000;
const DAY_IN_MS = 24 * HOUR_IN_MS;

export const getTimePassedMessage = (createdAt: string | Date, now: Date = new Date()): string => {
  const messageDate = createdAt instanceof Date ? createdAt : new Date(createdAt);

  if (Number.isNaN(messageDate.getTime())) {
    return '';
  }

  const diffMs = Math.max(0, now.getTime() - messageDate.getTime());
  const days = Math.floor(diffMs / DAY_IN_MS);

  if (days === 0) {
    const hours = Math.max(1, Math.floor(diffMs / HOUR_IN_MS));
    return `לפני ${hours} שעות`;
  }

  if (days === 1) {
    return 'אתמול';
  }

  return `לפני ${days} ימים`;
};

export const getBlessingByTime = (date: Date = new Date()): string => {
  const hours = date.getHours();

  if (hours >= 5 && hours < 12) {
    return 'בוקר טוב';
  }

  if (hours >= 12 && hours < 17) {
    return 'צהריים טובים';
  }

  if (hours >= 17 && hours < 21) {
    return 'ערב טוב';
  }

  return 'לילה טוב';
};

const toDateOrNull = (value?: string | Date | null): Date | null => {
  if (!value) {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const getIssueStatusTimelineMessage = (
  status: IssueStatus,
  timestamps: {
    createdAt: string | Date;
    openedAt?: string | Date | null;
    inProgressAt?: string | Date | null;
    doneAt?: string | Date | null;
  }
): string => {
  const openedAt = toDateOrNull(timestamps.openedAt) ?? toDateOrNull(timestamps.createdAt);
  const inProgressAt = toDateOrNull(timestamps.inProgressAt);
  const doneAt = toDateOrNull(timestamps.doneAt);

  if (status === IssueStatus.OPEN) {
    if (!openedAt) {
      return '';
    }

    const openedAgo = getTimePassedMessage(openedAt);
    const dayDiff = Math.floor((Date.now() - openedAt.getTime()) / DAY_IN_MS);

    if (dayDiff >= 7) {
      return `נפתח בתאריך ${openedAt.toLocaleDateString('he-IL')}`;
    }

    return `נפתח ${openedAgo}`;
  }

  if (status === IssueStatus.IN_PROGRESS) {
    if (!inProgressAt) {
      return 'עבר לטיפול';
    }

    return `עבר לטיפול ${getTimePassedMessage(inProgressAt)}`;
  }

  if (!doneAt) {
    return 'טופל';
  }

  return `טופל ${getTimePassedMessage(doneAt)}`;
};

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    return typeof message === 'string' ? message : fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

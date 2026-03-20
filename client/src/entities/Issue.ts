import { IssueStatus } from '@enums/IssueStatus';

export interface IssueImage {
  id: string;
  issueId: string;
  imageUrl: string;
  createdAt: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string | null;
  isUrgent: boolean;
  status: IssueStatus;
  openedAt: string;
  inProgressAt: string | null;
  doneAt: string | null;
  createdById: string;
  buildingId: string;
  createdAt: string;
  images: IssueImage[];
}

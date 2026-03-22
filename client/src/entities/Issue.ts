import { IssueStatus } from '@enums/IssueStatus';
import { Role } from '@enums/Role';

export interface IssueImage {
  id: string;
  issueId: string;
  imageUrl: string;
  createdAt: string;
}

export interface IssueCreator {
  id: string;
  name: string | null;
  role: Role;
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
  createdBy?: IssueCreator;
  buildingId: string;
  createdAt: string;
  images: IssueImage[];
}

import { Issue } from '@entities/Issue';
import { PaginationParams } from '../types/pagination';
import { axiosInstance } from './axiosInstance';

export type IssueStatusParam = 'open' | 'inProgress' | 'done';
export type IssueSortParam = 'new' | 'old' | 'asc' | 'desc';

export interface CreateIssuePayload {
  title: string;
  description?: string;
  isUrgent?: boolean;
  status?: IssueStatusParam;
  imageKeys?: string[];
}

export interface UpdateIssuePayload {
  title?: string;
  description?: string;
  isUrgent?: boolean;
  status?: IssueStatusParam;
}

interface UploadUrlFileMeta {
  filename: string;
  contentType: string;
}

interface UploadUrlItem {
  key: string;
  uploadUrl: string;
}

export interface IssueQueryParams extends PaginationParams {
  status?: IssueStatusParam;
  sort?: IssueSortParam;
}

export const issuesService = {
  getIssues: async (params: IssueQueryParams = {}): Promise<Issue[]> => {
    const response = await axiosInstance.get('/issues', { params });
    return response.data;
  },

  getIssueById: async (issueId: string): Promise<Issue> => {
    const response = await axiosInstance.get(`/issues/${issueId}`);
    return response.data;
  },

  createIssue: async (payload: CreateIssuePayload): Promise<Issue> => {
    const response = await axiosInstance.post('/issues', payload);
    return response.data.issue;
  },

  updateIssue: async (issueId: string, payload: UpdateIssuePayload): Promise<Issue> => {
    const response = await axiosInstance.patch(`/issues/${issueId}`, payload);
    return response.data.issue;
  },

  moveIssueToNextStatus: async (issueId: string): Promise<Issue> => {
    const response = await axiosInstance.patch(`/issues/${issueId}/next-status`);
    return response.data.issue;
  },

  moveIssueToPreviousStatus: async (issueId: string): Promise<Issue> => {
    const response = await axiosInstance.patch(`/issues/${issueId}/prev-status`);
    return response.data.issue;
  },

  deleteIssue: async (issueId: string): Promise<Issue> => {
    const response = await axiosInstance.delete(`/issues/${issueId}`);
    return response.data.issue;
  },

  generateUploadUrls: async (files: UploadUrlFileMeta[]): Promise<UploadUrlItem[]> => {
    const response = await axiosInstance.post('/issues/upload-urls', { files });
    return response.data.uploads;
  },

  uploadIssueImages: async (files: File[]): Promise<string[]> => {
    if (files.length === 0) {
      return [];
    }

    const uploads = await issuesService.generateUploadUrls(
      files.map((file) => ({
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
      }))
    );

    await Promise.all(
      uploads.map(async (upload, index) => {
        const file = files[index];

        if (!file) {
          throw new Error('קובץ חסר להעלאה');
        }

        const response = await fetch(upload.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
          },
          body: file,
        });

        if (!response.ok) {
          throw new Error('העלאת תמונה נכשלה');
        }
      })
    );

    return uploads.map((upload) => upload.key);
  },
};

import { Issue } from '@entities/Issue';
import { PaginationParams } from '../types/pagination';
import { axiosInstance } from './axiosInstance';

export const issuesService = {
  getIssues: async (params: PaginationParams = {}): Promise<Issue[]> => {
    const response = await axiosInstance.get('/issues', { params });
    return response.data;
  },

  moveIssueToNextStatus: async (issueId: string): Promise<Issue> => {
    const response = await axiosInstance.patch(`/issues/${issueId}/next-status`);
    return response.data.issue;
  },
};

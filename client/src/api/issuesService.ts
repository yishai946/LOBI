import { Issue } from '@entities/Issue';
import { PaginationParams } from '../types/pagination';
import { axiosInstance } from './axiosInstance';

export type IssueStatusParam = 'open' | 'inProgress' | 'done';
export type IssueSortParam = 'new' | 'old' | 'asc' | 'desc';

export interface IssueQueryParams extends PaginationParams {
  status?: IssueStatusParam;
  sort?: IssueSortParam;
}

export const issuesService = {
  getIssues: async (params: IssueQueryParams = {}): Promise<Issue[]> => {
    const response = await axiosInstance.get('/issues', { params });
    return response.data;
  },

  moveIssueToNextStatus: async (issueId: string): Promise<Issue> => {
    const response = await axiosInstance.patch(`/issues/${issueId}/next-status`);
    return response.data.issue;
  },
};

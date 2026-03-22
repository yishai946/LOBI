import { IssueStatus } from '@enums/IssueStatus';

const issueStatusTranslations: Record<IssueStatus, string> = {
  [IssueStatus.OPEN]: 'פתוח',
  [IssueStatus.IN_PROGRESS]: 'בטיפול',
  [IssueStatus.DONE]: 'טופל',
};

export const translateIssueStatus = (status: IssueStatus): string => {
  return issueStatusTranslations[status] || status;
};

import z from "zod";
import { IssueStatus } from "../enums/issueStatus.enum";

const issueStatusValues = Object.values(IssueStatus) as [
  IssueStatus,
  ...IssueStatus[],
];

export const uploadUrlsSchema = z.object({
  files: z
    .array(
      z.object({
        filename: z.string().min(1, "שם קובץ נדרש"),
        contentType: z.string().min(1, "סוג תוכן נדרש"),
      }),
    )
    .max(3, "מקסימום 3 קבצים"),
});

export const createIssueSchema = z.object({
  title: z.string().min(1, "כותרת נדרשת"),
  description: z.string().optional(),
  isUrgent: z.boolean().optional(),
  status: z.enum(issueStatusValues).optional(),
  imageKeys: z.array(z.string()).max(3, "מקסימום 3 תמונות").optional(),
});

export const updateIssueSchema = z.object({
  title: z.string().min(1, "כותרת נדרשת").optional(),
  description: z.string().optional(),
  isUrgent: z.boolean().optional(),
  status: z.enum(issueStatusValues).optional(),
});

export type UploadUrlsCommand = z.infer<typeof uploadUrlsSchema>;
export type CreateIssueCommand = z.infer<typeof createIssueSchema>;
export type UpdateIssueCommand = z.infer<typeof updateIssueSchema>;

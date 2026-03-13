import z from "zod";

const issueImageSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  contentType: z.string().min(1, "Content type is required"),
});

export const createIssueSchema = z.object({
  location: z.string().min(1, "Location is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
  images: z.array(issueImageSchema).max(3, "Maximum 3 images").optional(),
});

export const issueUploadUrlSchema = z.object({
  issueId: z.uuid("Invalid issue ID"),
  fileName: z.string().min(1, "File name is required"),
  contentType: z.string().min(1, "Content type is required"),
});

export const updateIssueSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]).optional(),
  adminComment: z.string().optional(),
});

export type CreateIssueCommand = z.infer<typeof createIssueSchema>;
export type IssueUploadUrlCommand = z.infer<typeof issueUploadUrlSchema>;
export type UpdateIssueCommand = z.infer<typeof updateIssueSchema>;

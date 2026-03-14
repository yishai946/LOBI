import z from "zod";

export const uploadUrlsSchema = z.object({
  files: z
    .array(
      z.object({
        filename: z.string().min(1, "Filename is required"),
        contentType: z.string().min(1, "Content type is required"),
      }),
    )
    .max(3, "Maximum 3 files"),
});

export const createIssueSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  apartmentId: z.uuid("Invalid apartment ID").optional(),
  imageKeys: z.array(z.string()).max(3, "Maximum 3 images").optional(),
});

export const updateIssueSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
});

export type UploadUrlsCommand = z.infer<typeof uploadUrlsSchema>;
export type CreateIssueCommand = z.infer<typeof createIssueSchema>;
export type UpdateIssueCommand = z.infer<typeof updateIssueSchema>;

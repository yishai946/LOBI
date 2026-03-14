import z from "zod";

export const createMessageSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  isUrgent: z.boolean().optional(),
});

export type CreateMessageCommand = z.infer<typeof createMessageSchema>;

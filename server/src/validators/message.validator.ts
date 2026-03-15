import z from "zod";

export const createMessageSchema = z.object({
  title: z.string().min(1, "כותרת נדרשת"),
  content: z.string().min(1, "תוכן נדרש"),
  isUrgent: z.boolean().optional(),
});

export type CreateMessageCommand = z.infer<typeof createMessageSchema>;

import z from "zod";

export const createMessageSchema = z.object({
  title: z.string().min(1, "כותרת נדרשת"),
  content: z.string().min(1, "תוכן נדרש"),
  isUrgent: z.boolean().optional(),
  isPinned: z.boolean().optional(),
});

export const updateMessageSchema = z
  .object({
    title: z.string().min(1, "כותרת נדרשת").optional(),
    content: z.string().min(1, "תוכן נדרש").optional(),
    isUrgent: z.boolean().optional(),
    isPinned: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.content !== undefined ||
      data.isUrgent !== undefined ||
      data.isPinned !== undefined,
    {
      message: "לא סופקו עדכונים",
    },
  );

export type CreateMessageCommand = z.infer<typeof createMessageSchema>;
export type UpdateMessageCommand = z.infer<typeof updateMessageSchema>;

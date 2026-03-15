import z from "zod";

export const createResidentSchema = z.object({
  userId: z.uuid("מזהה משתמש לא תקין"),
  apartmentId: z.uuid("מזהה דירה לא תקין"),
});

export const updateResidentSchema = z.object({
  apartmentId: z.uuid("מזהה דירה לא תקין").optional(),
});

export type CreateResidentCommand = z.infer<typeof createResidentSchema>;
export type UpdateResidentCommand = z.infer<typeof updateResidentSchema>;

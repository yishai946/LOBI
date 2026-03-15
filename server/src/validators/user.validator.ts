import z from "zod";

export const createResidentSchema = z.object({
  phone: z
    .string()
    .regex(/^05\d{8}$/, "מספר הטלפון חייב להתחיל ב-05 ולהכיל 10 ספרות"),
  apartmentId: z.uuid("מזהה דירה לא תקין"),
});

export const createManagerSchema = z.object({
  phone: z
    .string()
    .regex(/^05\d{8}$/, "מספר הטלפון חייב להתחיל ב-05 ולהכיל 10 ספרות"),
  apartmentId: z.uuid("מזהה דירה לא תקין").optional(),
  buildingId: z.uuid("מזהה בניין לא תקין"),
});

export const updateMeSchema = z.object({
  name: z.string().min(1, "שם נדרש").optional(),
});

export type CreateResidentCommand = z.infer<typeof createResidentSchema>;
export type CreateManagerCommand = z.infer<typeof createManagerSchema>;
export type UpdateMeCommand = z.infer<typeof updateMeSchema>;

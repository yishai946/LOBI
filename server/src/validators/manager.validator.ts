import z from "zod";

export const createManagerSchema = z.object({
  userId: z.uuid("מזהה משתמש לא תקין"),
  buildingId: z.uuid("מזהה בניין לא תקין"),
});

export type CreateManagerCommand = z.infer<typeof createManagerSchema>;

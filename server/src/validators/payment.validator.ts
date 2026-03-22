import z from "zod";

export const createPaymentSchema = z.object({
  title: z.string().min(1, "כותרת נדרשת"),
  description: z.string().optional(),
  amount: z.number().positive("הסכום חייב להיות גדול מ-0"),
  dueAt: z.coerce.date(),
  buildingId: z.uuid("מזהה בניין לא תקין"),
  isRecurring: z.boolean(),
});

export const checkoutPaymentSchema = z.object({
  isRecurring: z.boolean().optional(),
});

export const updatePaymentSchema = z.object({
  title: z.string().min(1, "כותרת נדרשת").optional(),
  description: z.string().optional(),
  amount: z.number().positive("הסכום חייב להיות גדול מ-0").optional(),
  dueAt: z.coerce.date().optional(),
  isRecurring: z.boolean().optional(),
});

export const createRecurringSeriesSchema = z.object({
  title: z.string().min(1, "כותרת נדרשת"),
  description: z.string().optional(),
  amount: z.number().positive("הסכום חייב להיות גדול מ-0"),
  buildingId: z.uuid("מזהה בניין לא תקין"),
  cadence: z.enum(["MONTHLY"]).default("MONTHLY"),
  anchorDay: z
    .number()
    .int("יום חיוב חייב להיות מספר שלם")
    .min(1, "יום חיוב מינימלי הוא 1")
    .max(28, "יום חיוב מקסימלי הוא 28"),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  createInitialPayment: z.boolean().default(true),
});

export const updateRecurringSeriesSchema = z.object({
  title: z.string().min(1, "כותרת נדרשת").optional(),
  description: z.string().optional(),
  amount: z.number().positive("הסכום חייב להיות גדול מ-0").optional(),
  endsAt: z.coerce.date().nullable().optional(),
  status: z.enum(["ACTIVE", "PAUSED", "ENDED"]).optional(),
});

export const setRecurringEnrollmentSchema = z.object({
  enabled: z.boolean(),
});

export type CreatePaymentCommand = z.infer<typeof createPaymentSchema>;
export type CheckoutPaymentCommand = z.infer<typeof checkoutPaymentSchema>;
export type UpdatePaymentCommand = z.infer<typeof updatePaymentSchema>;
export type CreateRecurringSeriesCommand = z.infer<
  typeof createRecurringSeriesSchema
>;
export type UpdateRecurringSeriesCommand = z.infer<
  typeof updateRecurringSeriesSchema
>;
export type SetRecurringEnrollmentCommand = z.infer<
  typeof setRecurringEnrollmentSchema
>;

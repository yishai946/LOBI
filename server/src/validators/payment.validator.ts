import z from "zod";

export const createPaymentSchema = z.object({
  title: z.string().min(1, "כותרת נדרשת"),
  description: z.string().optional(),
  amount: z.number().positive("הסכום חייב להיות גדול מ-0"),
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
  isRecurring: z.boolean().optional(),
});

export type CreatePaymentCommand = z.infer<typeof createPaymentSchema>;
export type CheckoutPaymentCommand = z.infer<typeof checkoutPaymentSchema>;
export type UpdatePaymentCommand = z.infer<typeof updatePaymentSchema>;

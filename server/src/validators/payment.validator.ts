import z from "zod";

export const createPaymentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  amount: z.number().positive("Amount must be greater than 0"),
  buildingId: z.uuid("Invalid building ID"),
  isRecurring: z.boolean(),
});

export const checkoutPaymentSchema = z.object({
  isRecurring: z.boolean().optional(),
});

export const updatePaymentSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  amount: z.number().positive("Amount must be greater than 0").optional(),
  isRecurring: z.boolean().optional(),
});

export type CreatePaymentCommand = z.infer<typeof createPaymentSchema>;
export type CheckoutPaymentCommand = z.infer<typeof checkoutPaymentSchema>;
export type UpdatePaymentCommand = z.infer<typeof updatePaymentSchema>;

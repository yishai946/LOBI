import { z } from "zod";

export const requestOtpSchema = z.object({
  phone: z
    .string()
    .regex(/^05\d{8}$/, "מספר הטלפון חייב להתחיל ב-05 ולהכיל 10 ספרות"),
});

export const verifyOtpSchema = z.object({
  phone: z
    .string()
    .regex(/^05\d{8}$/, "מספר הטלפון חייב להתחיל ב-05 ולהכיל 10 ספרות"),
  otp: z.string().length(6, "קוד OTP חייב להיות באורך 6 ספרות"),
});

export const completeProfileSchema = z.object({
  name: z.string().min(1, "שם נדרש"),
});

export const selectContextSchema = z.object({
  type: z.enum(["ADMIN", "RESIDENT", "MANAGER"]),
  buildingId: z.uuid().optional(),
  apartmentId: z.uuid().optional(),
});

export type RequestOtpCommand = z.infer<typeof requestOtpSchema>;
export type VerifyOtpCommand = z.infer<typeof verifyOtpSchema>;
export type CompleteProfileCommand = z.infer<typeof completeProfileSchema>;
export type SelectContextCommand = z.infer<typeof selectContextSchema>;

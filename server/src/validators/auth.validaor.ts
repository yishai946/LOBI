import { z } from "zod";
import { SessionType } from "../enums/sessionType.enum";

export const requestOtpSchema = z.object({
  phone: z
    .string()
    .regex(
      /^05\d{8}$/,
      "Phone number must start with 05 and be 10 digits long",
    ),
});

export const verifyOtpSchema = z.object({
  phone: z
    .string()
    .regex(
      /^05\d{8}$/,
      "Phone number must start with 05 and be 10 digits long",
    ),
  otp: z.string().length(6, "OTP must be 6 digits long"),
});

export const completeProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export const selectContextSchema = z.object({
  sessionType: z.enum(SessionType),
  buildingId: z.uuid().optional(),
  apartmentId: z.uuid().optional(),
});

export type RequestOtpCommand = z.infer<typeof requestOtpSchema>;
export type VerifyOtpCommand = z.infer<typeof verifyOtpSchema>;
export type CompleteProfileCommand = z.infer<typeof completeProfileSchema>;
export type SelectContextCommand = z.infer<typeof selectContextSchema>;

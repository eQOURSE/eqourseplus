import { z } from "zod";

const normalizedEmailSchema = z.string().trim().toLowerCase().pipe(z.email());
const e164PhoneSchema = z.string().trim().regex(/^\+[1-9]\d{7,14}$/);
const countryCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .pipe(z.string().regex(/^[A-Z]{2}$/));
const panSchema = z.string().trim().toUpperCase().pipe(z.string().min(1));
const otpSchema = z.string().regex(/^\d{6}$/);

export const registrationRequestSchema = z
  .strictObject({
    email: normalizedEmailSchema,
    phone: e164PhoneSchema,
    countryCode: countryCodeSchema,
    pan: panSchema.optional(),
  })
  .superRefine((value, context) => {
    if (value.pan !== undefined && value.countryCode !== "IN") {
      context.addIssue({
        code: "custom",
        path: ["pan"],
        message: "PAN is only accepted for India",
      });
    }
  });

export const registrationVerifySchema = z.strictObject({
  email: normalizedEmailSchema,
  phone: e164PhoneSchema,
  emailOtp: otpSchema,
  phoneOtp: otpSchema,
});

export type RegistrationRequest = z.infer<typeof registrationRequestSchema>;
export type RegistrationVerifyRequest = z.infer<
  typeof registrationVerifySchema
>;

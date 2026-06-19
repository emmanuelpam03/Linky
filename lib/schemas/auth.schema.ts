import { z } from "zod"

export const signupSchema = z.object({
  fullName: z.string({ message: "Full name is required" }).min(1, "Full name is required"),
  username: z.string({ message: "Username is required" }).min(1, "Username is required"),
  email: z.string({ message: "Email is required" }).email("Invalid email address"),
  password: z.string({ message: "Password is required" }).min(8, "Password must be at least 8 characters"),
})

export const loginSchema = z.object({
  email: z.string({ message: "Email is required" }).email("Invalid email address"),
  password: z.string({ message: "Password is required" }).min(8, "Password must be at least 8 characters"),
})

export const forgotPasswordSchema = z.object({
  email: z.string({ message: "Email is required" }).email("Invalid email address"),
})

export const resetPasswordSchema = z.object({
  newPassword: z.string({ message: "New password is required" }).min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string({ message: "Confirm password is required" }).min(8, "Confirm password must be at least 8 characters"),
})
export const verifyOtpSchema = z.object({
    otp: z.string({ message: "OTP is required" }).min(6, "OTP must be 6 digits"),
})

export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>
export type VerifyOtpSchema = z.infer<typeof verifyOtpSchema>
export type SignupSchema = z.infer<typeof signupSchema>
export type LoginSchema = z.infer<typeof loginSchema>
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>
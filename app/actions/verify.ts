"use server"

import { auth } from "@/lib/auth"

export async function verifyEmail(email: string, otp: string) {
  try {
    await auth.api.verifyEmailOTP({
      body: { email, otp },
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Invalid or expired code",
    }
  }
}

export async function resendVerificationOTP(email: string) {
  try {
    await auth.api.sendVerificationOTP({
      body: { email, type: "email-verification" },
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to resend code",
    }
  }
}
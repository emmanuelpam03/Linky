// app/actions/auth/forgot-password.ts
"use server"

import { auth } from "@/lib/auth"

export async function requestPasswordReset(email: string) {
  try {
    await auth.api.requestPasswordResetEmailOTP({
      body: { email },
    })
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    }
  }
}

export async function resetPassword(email: string, otp: string, password: string) {
  try {
    await auth.api.resetPasswordEmailOTP({
      body: { email, otp, password },
    })
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    }
  }
}
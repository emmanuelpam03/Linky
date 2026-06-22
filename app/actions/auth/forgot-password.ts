// app/actions/auth/forgot-password.ts
"use server";

import { auth } from "@/lib/auth";

export async function requestPasswordReset(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: "Invalid email format" };
  }

  try {
    await auth.api.requestPasswordResetEmailOTP({
      body: { email },
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    };
  }
}

export async function resetPassword(
  email: string,
  otp: string,
  password: string,
) {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: "Invalid email format" };
  }

  // Validate OTP format
  if (!otp || otp.length !== 6 || !/^\d+$/.test(otp)) {
    return { success: false, error: "Invalid code format" };
  }

  // Validate password strength
  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters" };
  }
  if (
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/\d/.test(password)
  ) {
    return {
      success: false,
      error: "Password must contain uppercase, lowercase, and numbers",
    };
  }

  try {
    await auth.api.resetPasswordEmailOTP({
      body: { email, otp, password },
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    };
  }
}

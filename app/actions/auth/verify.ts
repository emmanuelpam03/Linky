"use server";

import { auth } from "@/lib/auth";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

export async function verifyEmail(
  email: string,
  otp: string,
): Promise<ActionResult> {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: "Invalid email format" };
  }

  // Validate OTP (adjust format based on your OTP requirements)
  if (!otp || otp.length !== 6 || !/^\d+$/.test(otp)) {
    return { success: false, error: "Invalid OTP format" };
  }
  try {
    await auth.api.verifyEmailOTP({
      body: { email, otp },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Invalid or expired code",
    };
  }
}

export async function resendVerificationOTP(
  email: string,
): Promise<ActionResult> {
  try {
    await auth.api.sendVerificationOTP({
      body: { email, type: "email-verification" },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to resend code",
    };
  }
}

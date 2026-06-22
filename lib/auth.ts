import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/prisma";
import { emailOTP, username } from "better-auth/plugins";

const baseURL = process.env.NEXT_PUBLIC_APP_URL;
if (!baseURL) {
  throw new Error(
    "NEXT_PUBLIC_APP_URL environment variable is required for Better Auth configuration",
  );
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    username(),
    emailOTP({
      otpLength: 6,
      expiresIn: 300, // 5 minutes, matches your frontend timer
      allowedAttempts: 5,
      storeOTP: "hashed", // never store raw OTPs
      sendVerificationOnSignUp: true,
      overrideDefaultEmailVerification: true, // uses OTP instead of link
      async sendVerificationOTP({ email, otp, type }) {
        if (type === "email-verification") {
          // TODO: plug in Resend, Nodemailer, etc.
          console.log(`[email-verification] Sending OTP ${otp} to ${email}`);
        } else if (type === "forget-password") {
          console.log(`[forget-password] Sending OTP ${otp} to ${email}`);
        }
      },
    }),
  ],

  baseURL,
  // trustedOrigins: ["http://localhost:3001"],
});

export type Auth = typeof auth;

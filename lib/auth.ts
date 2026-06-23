import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/prisma";
import { emailOTP, username } from "better-auth/plugins";
import { sendEmail } from "./mailer";

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
    requireEmailVerification: true,
  },
  plugins: [
    username(),
    emailOTP({
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 5,
      storeOTP: "hashed",
      sendVerificationOnSignUp: true,
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        if (type === "email-verification") {
          await sendEmail({
            to: email,
            subject: "Verify your email",
            html: `
              <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                <h2 style="color: #04342C;">Verify your email</h2>
                <p style="color: #5F5E5A;">Enter this code to verify your account:</p>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1D9E75; margin: 24px 0;">
                  ${otp}
                </div>
                <p style="color: #888;">This code expires in 5 minutes. If you didn't sign up, you can ignore this email.</p>
              </div>
            `,
          });
        }

        if (type === "forget-password") {
          await sendEmail({
            to: email,
            subject: "Reset your password",
            html: `
              <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                <h2 style="color: #04342C;">Reset your password</h2>
                <p style="color: #5F5E5A;">Enter this code to reset your password:</p>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1D9E75; margin: 24px 0;">
                  ${otp}
                </div>
                <p style="color: #888;">This code expires in 5 minutes. If you didn't request a reset, you can ignore this email.</p>
              </div>
            `,
          });
        }
      },
    }),
  ],

  user: {
    additionalFields: {
      bio: {
        type: "string",
        required: false,
        defaultValue: "",
        input: true,
      },
    },
  },

  baseURL,
  // trustedOrigins: ["http://localhost:3001"],
});

export type Auth = typeof auth;

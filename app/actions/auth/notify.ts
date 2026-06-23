"use server";

import { sendEmail } from "@/lib/mailer";

export async function sendPasswordChangeNotification(email: string) {
  void sendEmail({
    to: email,
    subject: "Your password was changed",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #04342C;">Password changed</h2>
        <p style="color: #5F5E5A;">
          Your password was successfully updated. If you didn't make this change,
          reset your password immediately.
        </p>
        
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/forgot-password"
          style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #1D9E75; color: white; border-radius: 8px; text-decoration: none; font-weight: 500;"
        >
          Reset password
        </a>
        <p style="margin-top: 24px; color: #888; font-size: 13px;">
          If you made this change, you can ignore this email.
        </p>
      </div>
    `,
  });
}

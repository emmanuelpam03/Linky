"use server";

import { auth } from "@/lib/auth";
import { signupSchema } from "@/lib/schemas/auth.schema";
import { z } from "zod";

export async function signup(data: z.infer<typeof signupSchema>) {
  const validatedData = signupSchema.parse(data);

  const response = await auth.api.signUpEmail({
    body: {
      email: validatedData.email,
      password: validatedData.password,
      name: validatedData.fullName,
      username: validatedData.username,
      callbackURL: `${process.env.NEXT_PUBLIC_APP_URL}/verify`,
    },
  });

  // 👇 handle Better Auth failure response
  if ("message" in response && "code" in response) {
    return {
      success: false,
      error: response.message,
    };
  }

  return {
    success: true,
    user: response.user,
  };
}

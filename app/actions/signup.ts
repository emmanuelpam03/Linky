"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { signupSchema } from "@/lib/schemas/auth.schema";
import { z } from "zod";

export async function signUp(
  data: z.infer<typeof signupSchema>,
): Promise<{ error?: { message: string }; success?: boolean }> {
  try {
    const result = await auth.api.signUpEmail({
      headers: await headers(),
      body: {
        email: data.email,
        password: data.password,
        name: data.fullName,
        username: data.username,
      },
    });

    console.log("RESULT:", result);

    return { success: true };
  } catch (error) {
    console.error("SERVER ERROR:", error);

    return {
      error: {
        message:
          error instanceof Error ? error.message : "An unexpected error occurred",
      },
    };
  }
}

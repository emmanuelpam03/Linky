"use server";

import { signupSchema } from "@/lib/schemas/auth.schema";
import { z } from "zod";

export async function signup(data: z.infer<typeof signupSchema>) {
  signupSchema.parse(data);

  return {
    success: false,
    error: "Signup is not available while authentication is being removed.",
  };
}

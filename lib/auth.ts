import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },

  user: {
    additionalFields: {
      username: {
        type: "string",
        required: true,
      },
    },
  },

  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  // trustedOrigins: ["http://localhost:3001"], 
});
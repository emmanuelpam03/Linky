import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { username } from "better-auth/plugins";

const baseURL = process.env.NEXT_PUBLIC_APP_URL;
if (!baseURL) {
  throw new Error(
    "NEXT_PUBLIC_APP_URL environment variable is required for Better Auth configuration",
  );
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [ 
        username() 
    ],
  baseURL,
  // trustedOrigins: ["http://localhost:3001"],
});

export type Auth = typeof auth;
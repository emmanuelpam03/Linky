import { createAuthClient } from "better-auth/react";
import { usernameClient, emailOTPClient } from "better-auth/client/plugins";

const baseURL = process.env.NEXT_PUBLIC_APP_URL;
if (!baseURL) {
  throw new Error(
    "NEXT_PUBLIC_APP_URL environment variable is required for auth client configuration",
  );
}

export const authClient = createAuthClient({
  plugins: [
    usernameClient(),
    emailOTPClient(),
  ],
  baseURL,
});

export const { signIn, signUp, signOut, useSession } = authClient;

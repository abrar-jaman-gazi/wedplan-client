
import { createAuthClient } from "better-auth/react";

const authUrl = process.env.NEXT_PUBLIC_AUTH_URL;

if (!authUrl) {
  throw new Error("NEXT_PUBLIC_AUTH_URL is not configured");
}

export const authClient = createAuthClient({
  baseURL: authUrl,
  fetchOptions: {
    credentials: "include",
  },
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient;

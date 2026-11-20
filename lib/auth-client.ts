import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

const authUrl = process.env.NEXT_PUBLIC_AUTH_URL;

if (!authUrl) {
  throw new Error("NEXT_PUBLIC_AUTH_URL is not configured");
}

export const authClient = createAuthClient({
  baseURL: authUrl,
  fetchOptions: {
    credentials: "include",
  },
  plugins: [
    inferAdditionalFields({
      user: {
        role: {
          type: "string",
        },
        businessName: {
          type: "string",
          required: false,
        },
      },
    }),
  ],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient;
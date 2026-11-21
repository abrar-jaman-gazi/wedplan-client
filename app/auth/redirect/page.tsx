
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthRedirectPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Verifying your account...");

  useEffect(() => {
    let active = true;

    const redirectUser = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_AUTH_URL}/api/auth/get-session`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Unable to verify your session.");
        }

        const session = await response.json();
        const user = session?.user;

        if (!user) {
          throw new Error("No authenticated session found.");
        }

        if (!active) return;

        if (user.isBlocked) {
          setMessage("Your account has been blocked.");
          await fetch(
            `${process.env.NEXT_PUBLIC_AUTH_URL}/api/auth/sign-out`,
            {
              method: "POST",
              credentials: "include",
            }
          );
          router.replace("/sign-in?error=blocked");
          return;
        }

        if (user.role === "customer") {
          router.replace("/customer/dashboard");
        } else if (user.role === "vendor") {
          router.replace("/vendor/dashboard");
        } else if (user.role === "admin") {
          router.replace("/admin/dashboard");
        } else {
          throw new Error("Your account has an unrecognized role.");
        }
      } catch (error) {
        if (!active) return;

        setMessage(
          error instanceof Error
            ? error.message
            : "Authentication failed."
        );

        router.replace("/sign-in?error=google");
      }
    };

    redirectUser();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf8f5]">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#e6ded8] border-t-[#49313e]" />
        <p className="text-sm text-[#786b70]">{message}</p>
      </div>
    </main>
  );
}

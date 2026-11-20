
"use client";

import { Suspense, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Heart,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { signIn } from "@/lib/auth-client";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const registered = searchParams.get("registered") === "1";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const result = await signIn.email({
        email: email.trim().toLowerCase(),
        password,
      });

      if (result.error) {
        setErrorMessage(
          result.error.message || "Unable to sign in. Check your credentials."
        );
        return;
      }

      const sessionResult = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_URL}/api/auth/get-session`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      if (!sessionResult.ok) {
        setErrorMessage("Login succeeded, but your session could not be verified.");
        return;
      }

      const sessionData = await sessionResult.json();
      const role = sessionData?.user?.role;

      if (role === "customer") {
        router.replace("/customer/dashboard");
      } else if (role === "vendor") {
        router.replace("/vendor/dashboard");
      } else if (role === "admin") {
        router.replace("/admin/dashboard");
      } else {
        setErrorMessage("Your account has an unrecognized role.");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#faf8f5]">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="relative hidden overflow-hidden bg-[#34232e] p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(52,35,46,0.96),rgba(91,57,68,0.78)),url('https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=85')] bg-cover bg-center" />

          <Link href="/" className="relative z-10 inline-flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d8b77c] text-[#34232e]">
              <Heart size={22} fill="currentColor" />
            </span>
            <span className="text-2xl font-semibold tracking-wide">WedPlan</span>
          </Link>

          <div className="relative z-10 max-w-lg">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.3em] text-[#e2c99d]">
              Welcome back
            </p>
            <h1 className="text-5xl font-semibold leading-tight xl:text-6xl">
              Your dream wedding is closer than you think.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-8 text-white/75">
              Sign in to continue discovering wedding services and managing
              your special day with WedPlan.
            </p>
          </div>

          <p className="relative z-10 text-sm text-white/50">
            Make your special day unforgettable.
          </p>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-14">
          <div className="w-full max-w-md">
            <Link
              href="/"
              className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-[#786b70] transition hover:text-[#9b7650]"
            >
              <ArrowLeft size={17} />
              Back to home
            </Link>

            <div className="mb-9">
              <Link
                href="/"
                className="mb-6 inline-flex items-center gap-2 text-xl font-semibold text-[#49313e] lg:hidden"
              >
                <Heart size={23} className="text-[#b48a55]" />
                WedPlan
              </Link>

              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#a47d50]">
                Welcome to WedPlan
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-[#34232e] sm:text-4xl">
                Sign in to your account
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#81777a]">
                Enter your account details to continue.
              </p>
            </div>

            {registered && (
              <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                Your account was created successfully. Please sign in.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-[#493d43]"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a39799]"
                  />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="w-full rounded-xl border border-[#e6ded8] bg-white py-3.5 pl-11 pr-4 text-sm text-[#49313e] outline-none transition placeholder:text-[#b0a6a5] focus:border-[#ad8454] focus:ring-2 focus:ring-[#ad8454]/15"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-[#493d43]"
                >
                  Password
                </label>
                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a39799]"
                  />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="w-full rounded-xl border border-[#e6ded8] bg-white py-3.5 pl-11 pr-12 text-sm text-[#49313e] outline-none transition placeholder:text-[#b0a6a5] focus:border-[#ad8454] focus:ring-2 focus:ring-[#ad8454]/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#96898b] hover:text-[#49313e]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#49313e] px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-[#49313e]/10 transition hover:bg-[#604354] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Signing in..." : "Sign in"}
                {!isLoading && <ArrowRight size={18} />}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-[#81777a]">
              Don&apos;t have an account?{" "}
              <Link
                href="/sign-up"
                className="font-semibold text-[#9a7045] hover:text-[#49313e]"
              >
                Create account
              </Link>
            </p>

            <p className="mt-8 text-center text-xs leading-5 text-[#a39799]">
              Your wedding planning journey continues here.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#faf8f5]">
          <p className="text-sm text-[#786b70]">Loading sign-in page...</p>
        </main>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
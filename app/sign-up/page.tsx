
"use client";

import { Suspense, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Heart,
  LockKeyhole,
  Mail,
  Store,
  User,
  UserRound,
} from "lucide-react";
import { signIn, signUp } from "@/lib/auth-client";

type AccountRole = "customer" | "vendor";

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [role, setRole] = useState<AccountRole>("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const googleError = searchParams.get("error") === "google";

  const handleGoogleSignUp = async () => {
    setErrorMessage("");

    if (role === "vendor" && businessName.trim().length < 2) {
      setErrorMessage("Please enter your business name.");
      return;
    }

    setIsLoading(true);

    try {
      const frontendUrl = window.location.origin;

      const result = await signIn.social({
        provider: "google",
        additionalData: {
          role,
          ...(role === "vendor"
            ? { businessName: businessName.trim() }
            : {}),
        },
        callbackURL: `${frontendUrl}/auth/redirect`,
        newUserCallbackURL: `${frontendUrl}/auth/redirect`,
        errorCallbackURL: `${frontendUrl}/sign-up?error=google`,
      });

      if (result.error) {
        setErrorMessage(
          result.error.message || "Google registration failed."
        );
        setIsLoading(false);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Google registration failed."
      );
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (name.trim().length < 2) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (role === "vendor" && businessName.trim().length < 2) {
      setErrorMessage("Please enter your business name.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Your password must contain at least 8 characters.");
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setErrorMessage("Your password must contain at least one uppercase letter.");
      return;
    }

    if (!/[a-z]/.test(password)) {
      setErrorMessage("Your password must contain at least one lowercase letter.");
      return;
    }

    if (password.length > 128) {
      setErrorMessage("Your password cannot exceed 128 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Your passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUp.email({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        ...(role === "vendor"
          ? { businessName: businessName.trim() }
          : {}),
      });

      if (result.error) {
        setErrorMessage(
          result.error.message || "Registration failed. Please try again."
        );
        return;
      }

      router.push("/sign-in?registered=1");
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

          <div className="relative z-10">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d8b77c] text-[#34232e]">
                <Heart size={22} fill="currentColor" />
              </span>
              <span className="text-2xl font-semibold tracking-wide">
                WedPlan
              </span>
            </Link>
          </div>

          <div className="relative z-10 max-w-lg">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.3em] text-[#e2c99d]">
              Your journey starts here
            </p>

            <h1 className="text-5xl font-semibold leading-tight xl:text-6xl">
              Every love story deserves a beautiful beginning.
            </h1>

            <p className="mt-6 max-w-md text-lg leading-8 text-white/75">
              Discover trusted wedding professionals, explore beautiful
              services, and bring your dream celebration to life with WedPlan.
            </p>

            <div className="mt-10 flex flex-wrap gap-5 text-sm text-white/80">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={17} className="text-[#e2c99d]" />
                Trusted professionals
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={17} className="text-[#e2c99d]" />
                Simple planning
              </span>
            </div>
          </div>

          <p className="relative z-10 text-sm text-white/50">
            Make your special day unforgettable.
          </p>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-14">
          <div className="w-full max-w-xl">
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-[#786b70] transition hover:text-[#9b7650]"
            >
              <ArrowLeft size={17} />
              Back to home
            </Link>

            <div className="mb-8">
              <Link
                href="/"
                className="mb-6 inline-flex items-center gap-2 text-xl font-semibold text-[#49313e] lg:hidden"
              >
                <Heart size={23} className="text-[#b48a55]" />
                WedPlan
              </Link>

              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#a47d50]">
                Join WedPlan
              </p>

              <h2 className="text-3xl font-semibold tracking-tight text-[#34232e] sm:text-4xl">
                Create your account
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#81777a]">
                Start planning your perfect wedding or grow your wedding
                business with us.
              </p>
            </div>

            <div className="mb-7">
              <p className="mb-3 text-sm font-semibold text-[#493d43]">
                I want to join as a
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("customer")}
                  disabled={isLoading}
                  aria-pressed={role === "customer"}
                  className={`rounded-xl border p-4 text-left transition ${
                    role === "customer"
                      ? "border-[#ad8454] bg-[#f3eadd] ring-1 ring-[#ad8454]"
                      : "border-[#e8e0da] bg-white hover:border-[#c9ad8d]"
                  }`}
                >
                  <UserRound
                    size={23}
                    className={
                      role === "customer" ? "text-[#9a7045]" : "text-[#8d8183]"
                    }
                  />
                  <span className="mt-3 block font-semibold text-[#49313e]">
                    Customer
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-[#81777a]">
                    Plan your wedding
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("vendor")}
                  disabled={isLoading}
                  aria-pressed={role === "vendor"}
                  className={`rounded-xl border p-4 text-left transition ${
                    role === "vendor"
                      ? "border-[#ad8454] bg-[#f3eadd] ring-1 ring-[#ad8454]"
                      : "border-[#e8e0da] bg-white hover:border-[#c9ad8d]"
                  }`}
                >
                  <Store
                    size={23}
                    className={
                      role === "vendor" ? "text-[#9a7045]" : "text-[#8d8183]"
                    }
                  />
                  <span className="mt-3 block font-semibold text-[#49313e]">
                    Vendor
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-[#81777a]">
                    Offer wedding services
                  </span>
                </button>
              </div>
            </div>

            {role === "vendor" && (
              <div className="mb-5">
                <label
                  htmlFor="googleBusinessName"
                  className="mb-2 block text-sm font-medium text-[#493d43]"
                >
                  Business name for Google registration
                </label>

                <div className="relative">
                  <Store
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a39799]"
                  />
                  <input
                    id="googleBusinessName"
                    type="text"
                    autoComplete="organization"
                    placeholder="Enter your business name"
                    value={businessName}
                    onChange={(event) => setBusinessName(event.target.value)}
                    minLength={2}
                    disabled={isLoading}
                    className="w-full rounded-xl border border-[#e6ded8] bg-white py-3.5 pl-11 pr-4 text-sm text-[#49313e] outline-none transition placeholder:text-[#b0a6a5] focus:border-[#ad8454] focus:ring-2 focus:ring-[#ad8454]/15"
                  />
                </div>
              </div>
            )}

            {googleError && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Google registration was unsuccessful. Please try again.
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#e6ded8] bg-white px-5 py-3.5 text-sm font-semibold text-[#49313e] transition hover:bg-[#f8f5f1] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="text-lg font-bold">G</span>
              Continue with Google
            </button>

            <div className="my-5 flex items-center gap-4">
              <div className="h-px flex-1 bg-[#e6ded8]" />
              <span className="text-xs text-[#a39799]">
                OR REGISTER WITH EMAIL
              </span>
              <div className="h-px flex-1 bg-[#e6ded8]" />
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-[#493d43]"
                >
                  Full name
                </label>

                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a39799]"
                  />

                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    minLength={2}
                    disabled={isLoading}
                    className="w-full rounded-xl border border-[#e6ded8] bg-white py-3.5 pl-11 pr-4 text-sm text-[#49313e] outline-none transition placeholder:text-[#b0a6a5] focus:border-[#ad8454] focus:ring-2 focus:ring-[#ad8454]/15"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="businessName"
                  className="mb-2 block text-sm font-medium text-[#493d43]"
                >
                  Business name
                </label>

                {role === "vendor" && (
                  <div className="relative">
                    <Store
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a39799]"
                    />

                    <input
                      id="businessName"
                      type="text"
                      autoComplete="organization"
                      placeholder="Enter your business name"
                      value={businessName}
                      onChange={(event) => setBusinessName(event.target.value)}
                      required
                      minLength={2}
                      disabled={isLoading}
                      className="w-full rounded-xl border border-[#e6ded8] bg-white py-3.5 pl-11 pr-4 text-sm text-[#49313e] outline-none transition placeholder:text-[#b0a6a5] focus:border-[#ad8454] focus:ring-2 focus:ring-[#ad8454]/15"
                    />
                  </div>
                )}
              </div>

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
                    disabled={isLoading}
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
                    autoComplete="new-password"
                    placeholder="8+ characters, uppercase and lowercase"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={8}
                    maxLength={128}
                    disabled={isLoading}
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

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-[#493d43]"
                >
                  Confirm password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a39799]"
                  />

                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Enter your password again"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    required
                    disabled={isLoading}
                    className="w-full rounded-xl border border-[#e6ded8] bg-white py-3.5 pl-11 pr-12 text-sm text-[#49313e] outline-none transition placeholder:text-[#b0a6a5] focus:border-[#ad8454] focus:ring-2 focus:ring-[#ad8454]/15"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#96898b] hover:text-[#49313e]"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#49313e] px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-[#49313e]/10 transition hover:bg-[#604354] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Creating your account..." : "Create account"}
                {!isLoading && <ArrowRight size={18} />}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-[#81777a]">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="font-semibold text-[#9a7045] hover:text-[#49313e]"
              >
                Sign in
              </Link>
            </p>

            <p className="mt-8 text-center text-xs leading-5 text-[#a39799]">
              By creating an account, you agree to use WedPlan responsibly.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
  export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#faf8f5]">
          <p className="text-sm text-[#786b70]">
            Loading sign-up page...
          </p>
        </main>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}

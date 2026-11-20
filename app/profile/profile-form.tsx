
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ImagePlus,
  LoaderCircle,
  LockKeyhole,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { authClient, useSession } from "@/lib/auth-client";

type ProfileFormProps = {
  expectedRole: "customer" | "vendor";
};

export default function ProfileForm({ expectedRole }: ProfileFormProps) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const user = session?.user;

  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [image, setImage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isPending) return;

    if (!session) {
      router.replace("/sign-in");
      return;
    }

    if (user?.role !== expectedRole) {
      if (user?.role === "admin") {
        router.replace("/admin/dashboard");
      } else if (user?.role === "vendor") {
        router.replace("/vendor/dashboard");
      } else {
        router.replace("/customer/dashboard");
      }
    }
  }, [isPending, session, user?.role, expectedRole, router]);

  useEffect(() => {
    if (!user) return;

    setName(user.name || "");
    setImage(user.image || "");

    if (user.role === "vendor") {
      setBusinessName(user.businessName || "");
    }
  }, [user]);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const cleanName = name.trim();
    const cleanBusinessName = businessName.trim();
    const cleanImage = image.trim();

    if (cleanName.length < 2 || cleanName.length > 80) {
      setError("Your name must contain between 2 and 80 characters.");
      return;
    }

    if (expectedRole === "vendor" && cleanBusinessName.length < 2) {
      setError("Business name must contain at least 2 characters.");
      return;
    }

    if (cleanImage) {
      try {
        new URL(cleanImage);
      } catch {
        setError("Please enter a valid profile image URL.");
        return;
      }
    }

    setIsSaving(true);

    try {
      const payload =
        expectedRole === "vendor"
          ? {
              name: cleanName,
              image: cleanImage || null,
              businessName: cleanBusinessName,
            }
          : {
              name: cleanName,
              image: cleanImage || null,
            };

      const result = await authClient.updateUser(payload);

      if (result.error) {
        setError(
          result.error.message || "Unable to update your profile. Please try again."
        );
        return;
      }

      setSuccess("Your profile has been updated successfully.");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Something went wrong while updating your profile."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isPending || !user || user.role !== expectedRole) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf8f5]">
        <div className="text-center">
          <LoaderCircle className="mx-auto animate-spin text-[#9a7045]" size={34} />
          <p className="mt-3 text-sm text-[#81777a]">Loading your profile...</p>
        </div>
      </main>
    );
  }

  const initials =
    user.name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "W";

  const roleLabel = expectedRole === "vendor" ? "Vendor" : "Customer";

  return (
    <main className="min-h-screen bg-[#faf8f5] px-4 py-8 text-[#49313e] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href={`/${expectedRole}/dashboard`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#8f693f] transition hover:text-[#49313e]"
        >
          <ArrowLeft size={17} />
          Back to dashboard
        </Link>

        <div className="mt-7 overflow-hidden rounded-3xl border border-[#eee5dc] bg-white shadow-sm">
          <div className="relative overflow-hidden bg-[#49313e] px-6 py-9 text-white sm:px-9">
            <div className="absolute -right-12 -top-24 h-64 w-64 rounded-full border border-white/10" />
            <div className="absolute -right-2 -top-12 h-44 w-44 rounded-full border border-white/10" />

            <div className="relative z-10">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#e2c99d]">
                Account settings
              </p>
              <h1 className="mt-3 font-serif text-3xl sm:text-4xl">
                {expectedRole === "vendor" ? "Business Profile" : "My Profile"}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/75">
                Keep your WedPlan account information accurate and up to date.
              </p>
            </div>
          </div>

          <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[0.8fr_1.5fr]">
            <section>
              <div className="rounded-2xl bg-[#faf8f5] p-6 text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#f0e4d5] text-2xl font-bold text-[#8f693f] shadow-sm">
                  {image.trim() ? (
                    <img
                      src={image.trim()}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>

                <h2 className="mt-4 text-lg font-semibold text-[#49313e]">
                  {user.name}
                </h2>
                <p className="mt-1 break-all text-xs text-[#81777a]">
                  {user.email}
                </p>

                <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#f0e4d5] px-3 py-1.5 text-xs font-semibold text-[#8f693f]">
                  <ShieldCheck size={14} />
                  {roleLabel} account
                </span>
              </div>

              <div className="mt-5 rounded-2xl border border-[#eee5dc] p-5">
                <div className="flex items-center gap-3">
                  <LockKeyhole className="text-[#9a7045]" size={19} />
                  <h3 className="text-sm font-semibold">Protected information</h3>
                </div>
                <p className="mt-3 text-xs leading-6 text-[#81777a]">
                  Your email, account role, account status, and subscription
                  permissions are protected. They cannot be changed from this page.
                </p>
              </div>
            </section>

            <section>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-[#49313e]">
                  Personal information
                </h2>
                <p className="mt-1 text-sm text-[#81777a]">
                  Update the information associated with your account.
                </p>
              </div>

              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label
                    htmlFor="profile-name"
                    className="mb-2 block text-sm font-semibold text-[#49313e]"
                  >
                    Full name
                  </label>
                  <div className="relative">
                    <UserRound
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a39799]"
                    />
                    <input
                      id="profile-name"
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      minLength={2}
                      maxLength={80}
                      required
                      autoComplete="name"
                      className="w-full rounded-xl border border-[#e9e0d8] bg-[#fffdfa] py-3.5 pl-11 pr-4 text-sm text-[#49313e] outline-none transition focus:border-[#b58b5b] focus:ring-2 focus:ring-[#b58b5b]/10"
                    />
                  </div>
                </div>

                {expectedRole === "vendor" && (
                  <div>
                    <label
                      htmlFor="business-name"
                      className="mb-2 block text-sm font-semibold text-[#49313e]"
                    >
                      Business name
                    </label>
                    <div className="relative">
                      <UserRound
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a39799]"
                      />
                      <input
                        id="business-name"
                        type="text"
                        value={businessName}
                        onChange={(event) => setBusinessName(event.target.value)}
                        minLength={2}
                        maxLength={100}
                        required
                        className="w-full rounded-xl border border-[#e9e0d8] bg-[#fffdfa] py-3.5 pl-11 pr-4 text-sm text-[#49313e] outline-none transition focus:border-[#b58b5b] focus:ring-2 focus:ring-[#b58b5b]/10"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="profile-email"
                    className="mb-2 block text-sm font-semibold text-[#49313e]"
                  >
                    Email address
                  </label>
                  <input
                    id="profile-email"
                    type="email"
                    value={user.email}
                    readOnly
                    className="w-full cursor-not-allowed rounded-xl border border-[#e9e0d8] bg-[#f5f1ed] px-4 py-3.5 text-sm text-[#81777a] outline-none"
                  />
                  <p className="mt-2 text-xs text-[#a39799]">
                    Email address cannot be edited here.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="profile-image"
                    className="mb-2 block text-sm font-semibold text-[#49313e]"
                  >
                    Profile image URL
                  </label>
                  <div className="relative">
                    <ImagePlus
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a39799]"
                    />
                    <input
                      id="profile-image"
                      type="url"
                      value={image}
                      onChange={(event) => setImage(event.target.value)}
                      placeholder="https://example.com/your-photo.jpg"
                      className="w-full rounded-xl border border-[#e9e0d8] bg-[#fffdfa] py-3.5 pl-11 pr-4 text-sm text-[#49313e] outline-none transition focus:border-[#b58b5b] focus:ring-2 focus:ring-[#b58b5b]/10"
                    />
                  </div>
                  <p className="mt-2 text-xs text-[#a39799]">
                    Enter a publicly accessible image URL. Leave it empty to remove your profile image.
                  </p>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    {error}
                  </div>
                )}

                {success && (
                  <div
                    role="status"
                    className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
                  >
                    <CheckCircle2 size={17} />
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#49313e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#604354] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {isSaving ? (
                    <>
                      <LoaderCircle size={17} className="animate-spin" />
                      Saving changes...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      Save changes
                    </>
                  )}
                </button>
              </form>
            </section>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[#a39799]">
          WedPlan · Your day, your way.
        </p>
      </div>
    </main>
  );
}

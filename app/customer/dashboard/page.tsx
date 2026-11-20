
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Compass,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Sparkles,
  Store,
  UserRound,
  X,
} from "lucide-react";

import { signOut, useSession } from "@/lib/auth-client";

const navigation = [
  {
    label: "Overview",
    href: "/customer/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Explore Services",
    href: "/services",
    icon: Compass,
  },
  {
    label: "My Bookings",
    href: "/customer/bookings",
    icon: ClipboardList,
  },
  {
    label: "My Profile",
    href: "/customer/profile",
    icon: UserRound,
  },
];

const serviceCategories = [
  {
    title: "Wedding Photography",
    description: "Capture every special moment.",
    icon: Camera,
    href: "/services?category=photography",
  },
  {
    title: "Wedding Venues",
    description: "Find the perfect celebration space.",
    icon: Heart,
    href: "/services?category=venues",
  },
  {
    title: "Decoration",
    description: "Create a beautiful wedding atmosphere.",
    icon: Sparkles,
    href: "/services?category=decoration",
  },
  {
    title: "Catering",
    description: "Discover food and catering services.",
    icon: Store,
    href: "/services?category=catering",
  },
];

export default function CustomerDashboardPage() {
  const router = useRouter();

  const { data: session, isPending } = useSession();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  const user = session?.user;
  const userRole = user?.role;

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (!session) {
      router.replace("/sign-in");
      return;
    }

    if (userRole === "vendor") {
      router.replace("/vendor/dashboard");
    } else if (userRole === "admin") {
      router.replace("/admin/dashboard");
    }
  }, [isPending, session, userRole, router]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setSignOutError("");

    try {
      const result = await signOut();

      if (result.error) {
        setSignOutError(
          result.error.message || "Unable to sign out. Please try again."
        );
        setIsSigningOut(false);
        return;
      }

      router.replace("/sign-in");
      router.refresh();
    } catch {
      setSignOutError("Unable to sign out. Please try again.");
      setIsSigningOut(false);
    }
  };

  // Wait until the session and authenticated user are available.
  if (isPending || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf8f5]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#e8ded1] border-t-[#9a7045]" />
          <p className="mt-4 text-sm text-[#81777a]">
            Loading your dashboard...
          </p>
        </div>
      </main>
    );
  }

  if (userRole !== "customer") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf8f5] px-5">
        <div className="max-w-md rounded-2xl border border-[#eee5dc] bg-white p-8 text-center shadow-sm">
          <ShieldCheck
            className="mx-auto text-[#a47d50]"
            size={38}
          />

          <h1 className="mt-4 text-xl font-semibold text-[#34232e]">
            Customer access required
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#81777a]">
            This dashboard is available to customer accounts only.
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#49313e] px-5 py-3 text-sm font-semibold text-white"
          >
            Return home
            <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    );
  }

  const firstName =
    user.name?.trim().split(/\s+/)[0] || "there";

  const initials =
    user.name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "C";

  return (
    <main className="min-h-screen bg-[#faf8f5] text-[#49313e]">
      {isMobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-[#241923]/40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-[#eee5dc] bg-white transition-transform duration-300 lg:translate-x-0 ${
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-[#f0e9e2] px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2e8d9] text-[#9a7045]">
              <Heart size={21} fill="currentColor" />
            </span>

            <span className="text-xl font-bold tracking-tight">
              WedPlan
            </span>
          </Link>

          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setIsMobileMenuOpen(false)}
            className="rounded-lg p-2 text-[#81777a] hover:bg-[#faf8f5] lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-7">
          <p className="mb-4 px-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#b0a39e]">
            Customer workspace
          </p>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/customer/dashboard";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-[#f3eadd] text-[#8f693f]"
                      : "text-[#81777a] hover:bg-[#faf8f5] hover:text-[#49313e]"
                  }`}
                >
                  <Icon size={19} />
                  {item.label}

                  {isActive && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-[#ad8454]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-5">
          <div className="rounded-2xl bg-[#f8f3ed] p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#9a7045]">
              <Sparkles size={18} />
            </div>

            <p className="mt-3 text-sm font-semibold text-[#49313e]">
              Your dream day starts here
            </p>

            <p className="mt-1 text-xs leading-5 text-[#81777a]">
              Explore wedding professionals and discover services
              for your celebration.
            </p>

            <Link
              href="/services"
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#9a7045] hover:text-[#49313e]"
            >
              Explore services
              <ArrowRight size={14} />
            </Link>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="mt-5 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[#81777a] transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            <LogOut size={19} />
            {isSigningOut ? "Signing out..." : "Sign out"}
          </button>

          {signOutError && (
            <p
              role="alert"
              className="mt-2 px-3 text-xs text-red-600"
            >
              {signOutError}
            </p>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="min-h-screen lg:pl-[270px]">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#eee5dc] bg-white/95 px-5 backdrop-blur sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setIsMobileMenuOpen(true)}
              className="rounded-lg p-2 text-[#49313e] hover:bg-[#faf8f5] lg:hidden"
            >
              <Menu size={22} />
            </button>

            <div>
              <p className="text-xs text-[#a39799]">
                Workspace
              </p>

              <h1 className="text-sm font-semibold text-[#49313e]">
                Customer Dashboard
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-[#49313e]">
                {user.name}
              </p>

              <p className="text-xs text-[#a39799]">
                Customer account
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0e4d5] text-sm font-bold text-[#8f693f]">
              {initials}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          {/* Welcome banner */}
          <section className="relative overflow-hidden rounded-3xl bg-[#49313e] px-6 py-9 text-white sm:px-9 sm:py-12">
            <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full border border-white/10" />
            <div className="absolute -right-4 -top-12 h-52 w-52 rounded-full border border-white/10" />

            <div className="relative z-10 max-w-2xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#e2c99d]">
                Your wedding journey
              </p>

              <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
                Welcome back, {firstName}!
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-white/75 sm:text-base">
                Your special day deserves thoughtful planning.
                Explore trusted wedding professionals and start
                bringing your ideas together.
              </p>

              <Link
                href="/services"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#e2c99d] px-5 py-3.5 text-sm font-bold text-[#49313e] transition hover:bg-white"
              >
                Discover wedding services
                <ArrowRight size={17} />
              </Link>
            </div>
          </section>

          {/* Service categories */}
          <section className="mt-10">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a47d50]">
                  Start exploring
                </p>

                <h2 className="mt-2 text-2xl font-semibold text-[#34232e]">
                  Find everything for your big day
                </h2>

                <p className="mt-2 text-sm text-[#81777a]">
                  Explore services from wedding professionals.
                </p>
              </div>

              <Link
                href="/services"
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#9a7045] hover:text-[#49313e]"
              >
                View all services
                <ChevronRight size={17} />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {serviceCategories.map((category) => {
                const Icon = category.icon;

                return (
                  <Link
                    key={category.title}
                    href={category.href}
                    className="group rounded-2xl border border-[#eee5dc] bg-white p-5 transition hover:-translate-y-1 hover:border-[#d7c1a4] hover:shadow-lg hover:shadow-[#49313e]/5"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f6eee4] text-[#9a7045] transition group-hover:bg-[#49313e] group-hover:text-white">
                      <Icon size={22} />
                    </span>

                    <h3 className="mt-5 text-sm font-bold text-[#49313e]">
                      {category.title}
                    </h3>

                    <p className="mt-2 min-h-10 text-xs leading-5 text-[#81777a]">
                      {category.description}
                    </p>

                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#9a7045]">
                      Explore
                      <ArrowRight
                        size={14}
                        className="transition group-hover:translate-x-1"
                      />
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Bookings and account */}
          <section className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-[#eee5dc] bg-white p-6 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[#34232e]">
                    Recent bookings
                  </h2>

                  <p className="mt-1 text-xs text-[#a39799]">
                    Keep track of your wedding service requests.
                  </p>
                </div>

                <CalendarDays
                  size={22}
                  className="text-[#a47d50]"
                />
              </div>

              <div className="mt-7 rounded-xl border border-dashed border-[#e6ded8] bg-[#fcfaf7] px-5 py-9 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f2e8d9] text-[#9a7045]">
                  <ClipboardList size={22} />
                </span>

                <h3 className="mt-4 text-sm font-semibold text-[#49313e]">
                  Your booking list will appear here
                </h3>

                <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[#81777a]">
                  When you request a wedding service, you will be
                  able to track its status from this dashboard.
                </p>

                <Link
                  href="/services"
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#49313e] px-4 py-3 text-xs font-semibold text-white transition hover:bg-[#604354]"
                >
                  Find a service
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            {/* Account card */}
            <div className="rounded-2xl border border-[#eee5dc] bg-white p-6 sm:p-7">
              <h2 className="text-lg font-semibold text-[#34232e]">
                Your account
              </h2>

              <p className="mt-1 text-xs text-[#a39799]">
                Manage your personal information.
              </p>

              <div className="mt-6 flex items-center gap-3 rounded-xl bg-[#faf8f5] p-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f0e4d5] text-sm font-bold text-[#8f693f]">
                  {initials}
                </span>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#49313e]">
                    {user.name}
                  </p>

                  <p className="truncate text-xs text-[#a39799]">
                    {user.email}
                  </p>
                </div>
              </div>

              <Link
                href="/customer/profile"
                className="mt-5 flex items-center justify-between rounded-xl border border-[#eee5dc] px-4 py-3 text-sm font-medium text-[#49313e] transition hover:border-[#d7c1a4] hover:bg-[#fcfaf7]"
              >
                <span className="flex items-center gap-3">
                  <Settings
                    size={18}
                    className="text-[#9a7045]"
                  />
                  Profile settings
                </span>

                <ChevronRight
                  size={17}
                  className="text-[#a39799]"
                />
              </Link>

              <div className="mt-5 flex items-start gap-3 rounded-xl bg-[#f8f3ed] p-4">
                <CheckCircle2
                  size={19}
                  className="mt-0.5 shrink-0 text-[#9a7045]"
                />

                <div>
                  <p className="text-xs font-semibold text-[#49313e]">
                    Account connected
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#81777a]">
                    You are signed in to WedPlan as a customer.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <footer className="mt-10 border-t border-[#eee5dc] py-6 text-center text-xs text-[#a39799]">
            WedPlan · Your day, your way.
          </footer>
        </div>
      </div>
    </main>
  );
}


"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Crown,
  LayoutDashboard,
  LogOut,
  Menu,
  PackagePlus,
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
    href: "/vendor/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My Services",
    href: "/vendor/services",
    icon: BriefcaseBusiness,
  },
  {
    label: "Booking Requests",
    href: "/vendor/bookings",
    icon: ClipboardList,
  },
  {
    label: "Business Profile",
    href: "/vendor/profile",
    icon: Store,
  },
  {
    label: "Subscription",
    href: "/vendor/subscription",
    icon: Crown,
  },
];

export default function VendorDashboardPage() {
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

    if (userRole === "customer") {
      router.replace("/customer/dashboard");
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

  if (isPending || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf8f5]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#e8ded1] border-t-[#9a7045]" />
          <p className="mt-4 text-sm text-[#81777a]">
            Loading your vendor dashboard...
          </p>
        </div>
      </main>
    );
  }

  if (userRole !== "vendor") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf8f5] px-5">
        <div className="max-w-md rounded-2xl border border-[#eee5dc] bg-white p-8 text-center shadow-sm">
          <ShieldCheck
            className="mx-auto text-[#a47d50]"
            size={38}
          />
          <h1 className="mt-4 text-xl font-semibold text-[#34232e]">
            Vendor access required
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#81777a]">
            This dashboard is available to vendor accounts only.
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

  const firstName = user.name?.trim().split(/\s+/)[0] || "there";
  const businessName = user.businessName?.trim() || "Your business";
  const initials =
    user.name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "V";

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

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-[#eee5dc] bg-white transition-transform duration-300 lg:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-[#f0e9e2] px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2e8d9] text-[#9a7045]">
              <HeartIcon />
            </span>
            <span className="text-xl font-bold tracking-tight">WedPlan</span>
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
            Vendor workspace
          </p>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === "/vendor/dashboard";

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
              Grow your wedding business
            </p>
            <p className="mt-1 text-xs leading-5 text-[#81777a]">
              Present your services to couples planning their special day.
            </p>
            <Link
              href="/vendor/services"
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#9a7045] hover:text-[#49313e]"
            >
              Manage services
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
            <p role="alert" className="mt-2 px-3 text-xs text-red-600">
              {signOutError}
            </p>
          )}
        </div>
      </aside>

      <div className="min-h-screen lg:pl-[270px]">
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
              <p className="text-xs text-[#a39799]">Workspace</p>
              <h1 className="text-sm font-semibold text-[#49313e]">
                Vendor Dashboard
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-[#49313e]">
                {user.name}
              </p>
              <p className="text-xs text-[#a39799]">Vendor account</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0e4d5] text-sm font-bold text-[#8f693f]">
              {initials}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          <section className="relative overflow-hidden rounded-3xl bg-[#49313e] px-6 py-9 text-white sm:px-9 sm:py-12">
            <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full border border-white/10" />
            <div className="absolute -right-4 -top-12 h-52 w-52 rounded-full border border-white/10" />

            <div className="relative z-10 max-w-2xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#e2c99d]">
                Vendor workspace
              </p>
              <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
                Welcome back, {firstName}!
              </h2>
              <p className="mt-3 text-sm font-medium text-[#e2c99d]">
                {businessName}
              </p>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/75 sm:text-base">
                Manage your wedding services, respond to booking requests,
                and grow your business with WedPlan.
              </p>

              <Link
                href="/vendor/services"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#e2c99d] px-5 py-3.5 text-sm font-bold text-[#49313e] transition hover:bg-white"
              >
                Manage your services
                <ArrowRight size={17} />
              </Link>
            </div>
          </section>

          <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Active services"
              value="—"
              description="Connect your service records"
              icon={<BriefcaseBusiness size={21} />}
            />
            <SummaryCard
              title="Booking requests"
              value="—"
              description="Connect your booking records"
              icon={<CalendarDays size={21} />}
            />
            <SummaryCard
              title="Pending requests"
              value="—"
              description="Awaiting booking API"
              icon={<ClipboardList size={21} />}
            />
            <SummaryCard
              title="Subscription"
              value="—"
              description="Connect subscription details"
              icon={<CircleDollarSign size={21} />}
            />
          </section>

          <section className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-[#eee5dc] bg-white p-6 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[#34232e]">
                    Service management
                  </h2>
                  <p className="mt-1 text-xs text-[#a39799]">
                    Create and manage the services your business offers.
                  </p>
                </div>
                <BriefcaseBusiness size={22} className="text-[#a47d50]" />
              </div>

              <div className="mt-7 rounded-xl border border-dashed border-[#e6ded8] bg-[#fcfaf7] px-5 py-9 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f2e8d9] text-[#9a7045]">
                  <PackagePlus size={22} />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-[#49313e]">
                  Start showcasing your services
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[#81777a]">
                  Add your wedding services so customers can discover your
                  business and send booking requests.
                </p>
                <Link
                  href="/vendor/services"
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#49313e] px-4 py-3 text-xs font-semibold text-white transition hover:bg-[#604354]"
                >
                  Manage services
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-[#eee5dc] bg-white p-6 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[#34232e]">
                    Booking requests
                  </h2>
                  <p className="mt-1 text-xs text-[#a39799]">
                    Manage requests from customers.
                  </p>
                </div>
                <Bell size={21} className="text-[#a47d50]" />
              </div>

              <div className="mt-7 rounded-xl border border-dashed border-[#e6ded8] bg-[#fcfaf7] px-4 py-8 text-center">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#f2e8d9] text-[#9a7045]">
                  <CalendarDays size={21} />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-[#49313e]">
                  Your requests will appear here
                </h3>
                <p className="mt-2 text-xs leading-5 text-[#81777a]">
                  Booking information will appear after the booking API is
                  connected.
                </p>
              </div>

              <Link
                href="/vendor/bookings"
                className="mt-5 flex items-center justify-between rounded-xl border border-[#eee5dc] px-4 py-3 text-sm font-medium text-[#49313e] transition hover:border-[#d7c1a4] hover:bg-[#fcfaf7]"
              >
                View booking requests
                <ChevronRight size={17} className="text-[#a39799]" />
              </Link>
            </div>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#eee5dc] bg-white p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f6eee4] text-[#9a7045]">
                  <Crown size={21} />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-[#34232e]">
                    Subscription plan
                  </h2>
                  <p className="text-xs text-[#a39799]">
                    Manage your vendor plan.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-[#faf8f5] p-4">
                <p className="text-sm font-semibold text-[#49313e]">
                  Plan information
                </p>
                <p className="mt-2 text-xs leading-5 text-[#81777a]">
                  Your current plan, service allowance, and renewal
                  information will be displayed here once the subscription
                  API is connected.
                </p>
              </div>

              <Link
                href="/vendor/subscription"
                className="mt-5 flex items-center justify-between rounded-xl border border-[#eee5dc] px-4 py-3 text-sm font-medium text-[#49313e] transition hover:border-[#d7c1a4] hover:bg-[#fcfaf7]"
              >
                View subscription
                <ChevronRight size={17} className="text-[#a39799]" />
              </Link>
            </div>

            <div className="rounded-2xl border border-[#eee5dc] bg-white p-6 sm:p-7">
              <h2 className="text-lg font-semibold text-[#34232e]">
                Business profile
              </h2>
              <p className="mt-1 text-xs text-[#a39799]">
                Your registered vendor information.
              </p>

              <div className="mt-6 flex items-center gap-3 rounded-xl bg-[#faf8f5] p-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f0e4d5] text-sm font-bold text-[#8f693f]">
                  <Store size={20} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#49313e]">
                    {businessName}
                  </p>
                  <p className="truncate text-xs text-[#a39799]">
                    {user.email}
                  </p>
                </div>
              </div>

              <Link
                href="/vendor/profile"
                className="mt-5 flex items-center justify-between rounded-xl border border-[#eee5dc] px-4 py-3 text-sm font-medium text-[#49313e] transition hover:border-[#d7c1a4] hover:bg-[#fcfaf7]"
              >
                <span className="flex items-center gap-3">
                  <Settings size={18} className="text-[#9a7045]" />
                  Edit business profile
                </span>
                <ChevronRight size={17} className="text-[#a39799]" />
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
                    You are signed in to WedPlan as a vendor.
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

function SummaryCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#eee5dc] bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-[#81777a]">{title}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f6eee4] text-[#9a7045]">
          {icon}
        </span>
      </div>
      <p className="mt-4 text-2xl font-bold text-[#49313e]">{value}</p>
      <p className="mt-1 text-xs text-[#a39799]">{description}</p>
    </div>
  );
}

function HeartIcon() {
  return <Sparkles size={21} />;
}

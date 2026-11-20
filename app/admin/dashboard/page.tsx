
"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCw,
  ShieldCheck,
  Users,
  UserRound,
  X,
} from "lucide-react";

import { signOut, useSession } from "@/lib/auth-client";

type AdminSection = "overview" | "users" | "services" | "transactions";

interface AdminStats {
  totalUsers: number;
  totalVendors: number;
  totalCustomers: number;
  totalServices: number;
  pendingServices: number;
  totalTransactions: number;
}

const navigation: {
  label: string;
  value: AdminSection;
  icon: typeof LayoutDashboard;
}[] = [
  {
    label: "Overview",
    value: "overview",
    icon: LayoutDashboard,
  },
  {
    label: "Manage Users",
    value: "users",
    icon: Users,
  },
  {
    label: "Manage Services",
    value: "services",
    icon: BriefcaseBusiness,
  },
  {
    label: "Transactions",
    value: "transactions",
    icon: CreditCard,
  },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [activeSection, setActiveSection] =
    useState<AdminSection>("overview");

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);

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
    } else if (userRole === "vendor") {
      router.replace("/vendor/dashboard");
    }
  }, [isPending, session, userRole, router]);

  useEffect(() => {
    if (isPending || !session || userRole !== "admin") {
      return;
    }

    const controller = new AbortController();

    const fetchAdminStats = async () => {
      setStatsLoading(true);
      setStatsError("");

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        if (!apiUrl) {
          throw new Error("Backend API URL is not configured.");
        }

        const baseUrl = apiUrl.replace(/\/+$/, "");

        const authResponse = await fetch(
          `${baseUrl}/auth/token`,
          {
            method: "GET",
            credentials: "include",
            signal: controller.signal,
          }
        );

        if (!authResponse.ok) {
          throw new Error("Unable to retrieve your authentication token.");
        }

        const authData = await authResponse.json();

        if (
          typeof authData.token !== "string" ||
          !authData.token
        ) {
          throw new Error("Authentication token is unavailable. Please sign in again.");
        }

        const response = await fetch(
          `${baseUrl}/admin/stats`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              Authorization: `Bearer ${authData.token}`,
            },
            signal: controller.signal,
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success || !result.data) {
          throw new Error(
            result.message || "Unable to load dashboard statistics."
          );
        }

        const data = result.data;

        const statValues = [
          data.totalUsers,
          data.totalVendors,
          data.totalCustomers,
          data.totalServices,
          data.pendingServices,
          data.totalTransactions,
        ];

        if (
          !statValues.every(
            (value: unknown) =>
              typeof value === "number" &&
              Number.isFinite(value) &&
              value >= 0
          )
        ) {
          throw new Error("The server returned invalid dashboard statistics.");
        }

        setStats({
          totalUsers: data.totalUsers,
          totalVendors: data.totalVendors,
          totalCustomers: data.totalCustomers,
          totalServices: data.totalServices,
          pendingServices: data.pendingServices,
          totalTransactions: data.totalTransactions,
        });
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setStatsError(
          error instanceof Error
            ? error.message
            : "Something went wrong while loading dashboard statistics."
        );
      } finally {
        if (!controller.signal.aborted) {
          setStatsLoading(false);
        }
      }
    };

    void fetchAdminStats();

    return () => {
      controller.abort();
    };
  }, [isPending, session, userRole, statsRefreshKey]);

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

  const selectSection = (section: AdminSection) => {
    setActiveSection(section);
    setIsMobileMenuOpen(false);
  };

  const refreshStats = () => {
    setStatsRefreshKey((current) => current + 1);
  };

  if (isPending || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf8f5]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#e8ded1] border-t-[#9a7045]" />
          <p className="mt-4 text-sm text-[#81777a]">
            Loading admin dashboard...
          </p>
        </div>
      </main>
    );
  }

  if (userRole !== "admin") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf8f5] px-5">
        <div className="max-w-md rounded-2xl border border-[#eee5dc] bg-white p-8 text-center shadow-sm">
          <ShieldCheck
            className="mx-auto text-[#a47d50]"
            size={40}
          />

          <h1 className="mt-4 text-xl font-semibold text-[#34232e]">
            Administrator access required
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#81777a]">
            You do not have permission to access the administration
            dashboard.
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

  const initials =
    user.name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "A";

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
              <ShieldCheck size={21} />
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
            Administration
          </p>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => selectSection(item.value)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
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
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-5">
          <div className="rounded-2xl bg-[#f8f3ed] p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#9a7045]">
              <ShieldCheck size={18} />
            </div>

            <p className="mt-3 text-sm font-semibold text-[#49313e]">
              Platform administration
            </p>

            <p className="mt-1 text-xs leading-5 text-[#81777a]">
              Review platform activity and manage WedPlan accounts,
              services, and transactions.
            </p>
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
              <p className="text-xs text-[#a39799]">
                WedPlan management
              </p>

              <h1 className="text-sm font-semibold text-[#49313e]">
                {navigation.find(
                  (item) => item.value === activeSection
                )?.label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-[#49313e]">
                {user.name}
              </p>

              <p className="text-xs text-[#a39799]">
                Administrator
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0e4d5] text-sm font-bold text-[#8f693f]">
              {initials}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          {activeSection === "overview" && (
            <OverviewSection
              adminName={user.name || "Administrator"}
              stats={stats}
              statsLoading={statsLoading}
              statsError={statsError}
              onRefresh={refreshStats}
              onSelectSection={selectSection}
            />
          )}

          {activeSection === "users" && <UsersSection />}

          {activeSection === "services" && <ServicesSection />}

          {activeSection === "transactions" && (
            <TransactionsSection />
          )}

          <footer className="mt-10 border-t border-[#eee5dc] py-6 text-center text-xs text-[#a39799]">
            WedPlan Administration · Your day, your way.
          </footer>
        </div>
      </div>
    </main>
  );
}

function OverviewSection({
  adminName,
  stats,
  statsLoading,
  statsError,
  onRefresh,
  onSelectSection,
}: {
  adminName: string;
  stats: AdminStats | null;
  statsLoading: boolean;
  statsError: string;
  onRefresh: () => void;
  onSelectSection: (section: AdminSection) => void;
}) {
  const displayValue = (value: number | undefined) => {
    if (statsLoading && !stats) {
      return "...";
    }

    return value === undefined ? "—" : value.toLocaleString();
  };

  return (
    <>
      <section className="relative overflow-hidden rounded-3xl bg-[#49313e] px-6 py-9 text-white sm:px-9 sm:py-12">
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full border border-white/10" />
        <div className="absolute -right-4 -top-12 h-52 w-52 rounded-full border border-white/10" />

        <div className="relative z-10 max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#e2c99d]">
            Administration workspace
          </p>

          <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
            Welcome, {adminName}!
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-7 text-white/75 sm:text-base">
            Manage WedPlan users, review submitted wedding services,
            and monitor platform transactions from one place.
          </p>

          <button
            type="button"
            onClick={() => onSelectSection("users")}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#e2c99d] px-5 py-3.5 text-sm font-bold text-[#49313e] transition hover:bg-white"
          >
            Manage platform users
            <ArrowRight size={17} />
          </button>
        </div>
      </section>

      <section className="mt-9">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a47d50]">
              Platform overview
            </p>

            <h2 className="mt-2 text-2xl font-semibold text-[#34232e]">
              WedPlan statistics
            </h2>

            <p className="mt-2 text-sm text-[#81777a]">
              Live statistics retrieved from your WedPlan database.
            </p>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={statsLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#e8ded1] bg-white px-4 py-2.5 text-sm font-semibold text-[#8f693f] transition hover:bg-[#f8f3ed] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={statsLoading ? "animate-spin" : ""}
            />
            {statsLoading ? "Refreshing..." : "Refresh statistics"}
          </button>
        </div>

        {statsError && (
          <div
            role="alert"
            className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
          >
            <p className="text-sm text-red-700">
              {statsError}
            </p>

            <button
              type="button"
              onClick={onRefresh}
              className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
            >
              Try again
            </button>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <SummaryCard
            title="Registered users"
            value={displayValue(stats?.totalUsers)}
            description="Total registered platform accounts"
            icon={<Users size={21} />}
          />

          <SummaryCard
            title="Total vendors"
            value={displayValue(stats?.totalVendors)}
            description="Registered wedding service vendors"
            icon={<StoreIcon />}
          />

          <SummaryCard
            title="Total customers"
            value={displayValue(stats?.totalCustomers)}
            description="Registered customer accounts"
            icon={<UserRound size={21} />}
          />

          <SummaryCard
            title="Total services"
            value={displayValue(stats?.totalServices)}
            description="Services submitted to WedPlan"
            icon={<BriefcaseBusiness size={21} />}
          />

          <SummaryCard
            title="Pending services"
            value={displayValue(stats?.pendingServices)}
            description="Services awaiting admin approval"
            icon={<ClipboardList size={21} />}
          />

          <SummaryCard
            title="Total transactions"
            value={displayValue(stats?.totalTransactions)}
            description="Recorded platform transactions"
            icon={<CreditCard size={21} />}
          />
        </div>
      </section>

      <section className="mt-9">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-[#34232e]">
            Administration tools
          </h2>

          <p className="mt-2 text-sm text-[#81777a]">
            Choose an area to manage.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <ManagementCard
            title="Manage Users"
            description="View registered customers and vendors, search accounts, and manage blocked status."
            icon={<Users size={22} />}
            onClick={() => onSelectSection("users")}
          />

          <ManagementCard
            title="Manage Services"
            description="Review submitted wedding services, approve or reject submissions, and manage published services."
            icon={<BriefcaseBusiness size={22} />}
            onClick={() => onSelectSection("services")}
          />

          <ManagementCard
            title="Transactions"
            description="Review vendor subscription plans, payment amounts, payment statuses, and transaction dates."
            icon={<CreditCard size={22} />}
            onClick={() => onSelectSection("transactions")}
          />
        </div>
      </section>
    </>
  );
}

function UsersSection() {
  return (
    <ManagementPlaceholder
      eyebrow="Account administration"
      title="Manage users"
      description="View and manage all registered WedPlan customers and vendors."
      icon={<Users size={25} />}
      features={[
        "View all registered users",
        "Search by user name or email",
        "Filter users by Customer, Vendor, or Admin role",
        "View individual user details",
        "Block user accounts",
        "Unblock previously blocked accounts",
      ]}
    />
  );
}

function ServicesSection() {
  return (
    <ManagementPlaceholder
      eyebrow="Service moderation"
      title="Manage wedding services"
      description="Review service submissions and manage the services displayed on WedPlan."
      icon={<BriefcaseBusiness size={25} />}
      features={[
        "View all submitted services",
        "Search and filter service submissions",
        "Review pending services",
        "Approve submitted services",
        "Reject submitted services",
        "Change the status of published services",
        "Delete inappropriate services",
      ]}
    />
  );
}

function TransactionsSection() {
  return (
    <ManagementPlaceholder
      eyebrow="Payment monitoring"
      title="Platform transactions"
      description="Review vendor subscription payments and transaction records."
      icon={<CreditCard size={25} />}
      features={[
        "View vendor information",
        "View subscription plans",
        "View payment amounts and currency",
        "View payment statuses",
        "View transaction dates",
        "Review transaction records without manually changing payment success status",
      ]}
    />
  );
}

function ManagementPlaceholder({
  eyebrow,
  title,
  description,
  icon,
  features,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  features: string[];
}) {
  return (
    <section>
      <div className="rounded-3xl bg-[#49313e] px-6 py-9 text-white sm:px-9">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-[#e2c99d]">
            {icon}
          </span>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e2c99d]">
              {eyebrow}
            </p>

            <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">
              {title}
            </h2>
          </div>
        </div>

        <p className="mt-5 max-w-2xl text-sm leading-7 text-white/75">
          {description}
        </p>
      </div>

      <div className="mt-7 rounded-2xl border border-[#eee5dc] bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-[#34232e]">
              Available management operations
            </h3>

            <p className="mt-1 text-xs text-[#a39799]">
              These operations will become active after backend integration.
            </p>
          </div>

          <span className="rounded-full bg-[#f8f3ed] px-3 py-1.5 text-xs font-semibold text-[#9a7045]">
            API integration pending
          </span>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature}
              className="flex items-start gap-3 rounded-xl bg-[#fcfaf7] p-4"
            >
              <CheckCircle2
                size={18}
                className="mt-0.5 shrink-0 text-[#a47d50]"
              />

              <p className="text-sm leading-6 text-[#49313e]">
                {feature}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-7 flex items-start gap-3 rounded-xl border border-[#eee5dc] bg-[#faf8f5] p-4">
          <ShieldCheck
            size={20}
            className="mt-0.5 shrink-0 text-[#9a7045]"
          />

          <div>
            <p className="text-sm font-semibold text-[#49313e]">
              Protected administration
            </p>

            <p className="mt-1 text-xs leading-5 text-[#81777a]">
              User management, service moderation, and transaction
              information must be loaded through authenticated admin-only
              backend endpoints.
            </p>
          </div>
        </div>
      </div>
    </section>
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
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#eee5dc] bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-[#81777a]">
          {title}
        </p>

        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f6eee4] text-[#9a7045]">
          {icon}
        </span>
      </div>

      <p className="mt-4 text-2xl font-bold text-[#49313e]">
        {value}
      </p>

      <p className="mt-1 text-xs text-[#a39799]">
        {description}
      </p>
    </div>
  );
}

function ManagementCard({
  title,
  description,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-2xl border border-[#eee5dc] bg-white p-6 text-left transition hover:-translate-y-1 hover:border-[#d7c1a4] hover:shadow-lg hover:shadow-[#49313e]/5"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f6eee4] text-[#9a7045] transition group-hover:bg-[#49313e] group-hover:text-white">
        {icon}
      </span>

      <h3 className="mt-5 text-base font-bold text-[#49313e]">
        {title}
      </h3>

      <p className="mt-2 min-h-14 text-xs leading-6 text-[#81777a]">
        {description}
      </p>

      <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#9a7045]">
        Open section
        <ArrowRight
          size={14}
          className="transition group-hover:translate-x-1"
        />
      </span>
    </button>
  );
}

function StoreIcon() {
  return <BriefcaseBusiness size={21} />;
}


"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";

type TransactionStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "expired"
  | "refunded";

interface TransactionVendor {
  name?: string;
  email?: string;
  image?: string;
  businessName?: string;
}

interface PaymentCardDetails {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

interface Transaction {
  _id: string;
  vendorId: string;
  vendor?: TransactionVendor;
  plan: "premium";
  type?: "initial" | "renewal";
  amount: number;
  currency: string;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  stripeSessionId?: string | null;
  stripeSubscriptionId?: string | null;
  paymentMethod?: PaymentCardDetails | null;
}

interface Pagination {
  currentPage: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: Transaction[];
  pagination?: Pagination;
}

const statuses: {
  label: string;
  value: string;
}[] = [
  { label: "All statuses", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Paid", value: "paid" },
  { label: "Failed", value: "failed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Expired", value: "expired" },
  { label: "Refunded", value: "refunded" },
];

const statusStyles: Record<TransactionStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-slate-100 text-slate-700",
  expired: "bg-orange-100 text-orange-800",
  refunded: "bg-purple-100 text-purple-800",
};

const formatDate = (value: string | null) => {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatAmount = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("en-BD")} ${currency.toUpperCase()}`;
  }
};

export default function AdminTransactionsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [plan, setPlan] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  const user = session?.user;

  useEffect(() => {
    if (isPending) return;

    if (!session) {
      router.replace("/sign-in");
      return;
    }

    if (user?.role === "customer") {
      router.replace("/customer/dashboard");
    } else if (user?.role === "vendor") {
      router.replace("/vendor/dashboard");
    } else if (user?.role !== "admin") {
      router.replace("/");
    }
  }, [isPending, session, user?.role, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadTransactions = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setError("");

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        if (!apiUrl) {
          throw new Error("Backend API URL is not configured.");
        }

        const baseUrl = apiUrl.replace(/\/+$/, "");

        const authResponse = await fetch(`${baseUrl}/auth/token`, {
          method: "GET",
          credentials: "include",
          signal,
        });

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

        const params = new URLSearchParams({
          page: String(pagination.currentPage),
          limit: String(pagination.limit),
          search,
          status,
          plan,
        });

        const response = await fetch(
          `${baseUrl}/admin/transactions?${params.toString()}`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              Authorization: `Bearer ${authData.token}`,
            },
            signal,
          }
        );

        const result: ApiResponse = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Unable to retrieve transactions."
          );
        }

        if (!Array.isArray(result.data) || !result.pagination) {
          throw new Error("The server returned an invalid transaction response.");
        }

        setTransactions(result.data);
        setPagination(result.pagination);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading transactions."
        );
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [pagination.currentPage, pagination.limit, search, status, plan]
  );

  useEffect(() => {
    if (isPending || !session || user?.role !== "admin") {
      return;
    }

    const controller = new AbortController();

    void loadTransactions(controller.signal);

    return () => controller.abort();
  }, [isPending, session, user?.role, loadTransactions, refreshKey]);

  useEffect(() => {
    setPagination((current) => ({
      ...current,
      currentPage: 1,
    }));
  }, [search, status, plan]);

  const refreshTransactions = () => {
    setRefreshKey((current) => current + 1);
  };

  const changePage = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;

    setPagination((current) => ({
      ...current,
      currentPage: page,
    }));
  };

  if (isPending || !user || user.role !== "admin") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf8f5]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#e8ded1] border-t-[#9a7045]" />
          <p className="mt-4 text-sm text-[#81777a]">
            Loading transactions...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf8f5] px-4 py-8 text-[#292321] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-[#9a7045]">
              <ShieldCheck size={17} />
              <span className="font-semibold">WedPlan Administration</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Transactions
            </h1>

            <p className="mt-2 text-sm text-[#81777a]">
              Monitor Premium subscription payments and transaction records.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshTransactions}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e8ded1] bg-white px-5 py-3 text-sm font-semibold text-[#66513e] transition hover:bg-[#f5eee6] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        <section className="mb-7 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#eee5dc] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#81777a]">
                  Total transactions
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {pagination.total.toLocaleString("en-BD")}
                </p>
              </div>
              <div className="rounded-xl bg-[#f4eade] p-3 text-[#9a7045]">
                <CreditCard size={24} />
              </div>
            </div>
            <p className="mt-3 text-xs text-[#a49a91]">
              Matching the current search and filters
            </p>
          </div>

          <div className="rounded-2xl border border-[#eee5dc] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#81777a]">
                  Records on this page
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {transactions.length.toLocaleString("en-BD")}
                </p>
              </div>
              <div className="rounded-xl bg-[#f4eade] p-3 text-[#9a7045]">
                <ArrowDown size={24} />
              </div>
            </div>
            <p className="mt-3 text-xs text-[#a49a91]">
              Page {pagination.currentPage} of {Math.max(pagination.totalPages, 1)}
            </p>
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-[#eee5dc] bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[1fr_190px_190px]">
            <div>
              <label
                htmlFor="transaction-search"
                className="mb-2 block text-sm font-semibold text-[#665b55]"
              >
                Search transactions
              </label>

              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a49a91]"
                />
                <input
                  id="transaction-search"
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search vendor, email or Stripe session..."
                  className="w-full rounded-xl border border-[#e8ded1] bg-[#fdfbf9] py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#b38b61] focus:ring-2 focus:ring-[#b38b61]/15"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="transaction-status"
                className="mb-2 block text-sm font-semibold text-[#665b55]"
              >
                Payment status
              </label>

              <select
                id="transaction-status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="w-full rounded-xl border border-[#e8ded1] bg-[#fdfbf9] px-4 py-3 text-sm outline-none focus:border-[#b38b61]"
              >
                {statuses.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="transaction-plan"
                className="mb-2 block text-sm font-semibold text-[#665b55]"
              >
                Subscription plan
              </label>

              <select
                id="transaction-plan"
                value={plan}
                onChange={(event) => setPlan(event.target.value)}
                className="w-full rounded-xl border border-[#e8ded1] bg-[#fdfbf9] px-4 py-3 text-sm outline-none focus:border-[#b38b61]"
              >
                <option value="all">All plans</option>
                <option value="premium">Premium</option>
              </select>
            </div>
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={refreshTransactions}
              className="font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-[#eee5dc] bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-2 border-b border-[#eee5dc] px-5 py-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold">Payment records</h2>
              <p className="mt-1 text-xs text-[#81777a]">
                Transaction information is read-only for administrators.
              </p>
            </div>
            <span className="w-fit rounded-full bg-[#f4eade] px-3 py-1.5 text-xs font-semibold text-[#8b6744]">
              Premium subscriptions
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#e8ded1] border-t-[#9a7045]" />
              <p className="mt-4 text-sm text-[#81777a]">
                Loading transaction records...
              </p>
            </div>
          ) : error ? (
            <div className="flex min-h-52 items-center justify-center px-5 text-center text-sm text-[#81777a]">
              Transaction records could not be loaded.
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
              <div className="rounded-full bg-[#f7f1eb] p-4 text-[#9a7045]">
                <CreditCard size={28} />
              </div>
              <h3 className="mt-4 font-semibold">No transactions found</h3>
              <p className="mt-2 max-w-md text-sm text-[#81777a]">
                No records match your current search or filters.
              </p>
              {(searchInput || status !== "all" || plan !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
                    setStatus("all");
                    setPlan("all");
                  }}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#9a7045] hover:underline"
                >
                  <X size={15} />
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#faf8f5] text-xs uppercase tracking-wide text-[#81777a]">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Vendor</th>
                      <th className="px-5 py-4 font-semibold">Plan</th>
                      <th className="px-5 py-4 font-semibold">Amount</th>
                      <th className="px-5 py-4 font-semibold">Status</th>
                      <th className="px-5 py-4 font-semibold">Created</th>
                      <th className="px-5 py-4 font-semibold">Paid at</th>
                      <th className="px-5 py-4 text-right font-semibold">Details</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#f0e9e2]">
                    {transactions.map((transaction) => (
                      <tr
                        key={transaction._id}
                        className="transition hover:bg-[#fdfbf9]"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold">
                            {transaction.vendor?.businessName ||
                              transaction.vendor?.name ||
                              "Unknown vendor"}
                          </p>
                          <p className="mt-1 text-xs text-[#81777a]">
                            {transaction.vendor?.email || "Email unavailable"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-[#f4eade] px-3 py-1 text-xs font-semibold capitalize text-[#8b6744]">
                            {transaction.plan}
                          </span>
                          <p className="mt-1 text-xs capitalize text-[#81777a]">
                            {transaction.type || "initial"}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 font-semibold">
                          {formatAmount(transaction.amount, transaction.currency)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                              statusStyles[transaction.status] ||
                              "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {transaction.status}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-xs text-[#665b55]">
                          {formatDate(transaction.createdAt)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-xs text-[#665b55]">
                          {formatDate(transaction.paidAt)}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedTransaction(transaction)}
                            className="rounded-lg border border-[#e8ded1] px-3 py-2 text-xs font-semibold text-[#8b6744] transition hover:bg-[#f4eade]"
                          >
                            View details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-[#f0e9e2] lg:hidden">
                {transactions.map((transaction) => (
                  <article key={transaction._id} className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {transaction.vendor?.businessName ||
                            transaction.vendor?.name ||
                            "Unknown vendor"}
                        </p>
                        <p className="mt-1 break-all text-xs text-[#81777a]">
                          {transaction.vendor?.email || "Email unavailable"}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                          statusStyles[transaction.status] ||
                          "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-[#81777a]">Plan</p>
                        <p className="mt-1 font-medium capitalize">
                          {transaction.plan}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#81777a]">Amount</p>
                        <p className="mt-1 font-semibold">
                          {formatAmount(transaction.amount, transaction.currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#81777a]">Created</p>
                        <p className="mt-1 text-xs">
                          {formatDate(transaction.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#81777a]">Paid at</p>
                        <p className="mt-1 text-xs">
                          {formatDate(transaction.paidAt)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedTransaction(transaction)}
                      className="w-full rounded-xl border border-[#e8ded1] px-4 py-2.5 text-sm font-semibold text-[#8b6744] hover:bg-[#f4eade]"
                    >
                      View transaction details
                    </button>
                  </article>
                ))}
              </div>
            </>
          )}

          {!loading && !error && pagination.totalPages > 1 && (
            <div className="flex flex-col gap-3 border-t border-[#eee5dc] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-[#81777a]">
                Showing{" "}
                {pagination.total === 0
                  ? 0
                  : (pagination.currentPage - 1) * pagination.limit + 1}
                {" "}to{" "}
                {Math.min(
                  pagination.currentPage * pagination.limit,
                  pagination.total
                )}{" "}
                of {pagination.total} transactions
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.currentPage <= 1}
                  onClick={() => changePage(pagination.currentPage - 1)}
                  className="rounded-lg border border-[#e8ded1] p-2 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={18} />
                </button>

                <span className="min-w-20 text-center text-sm font-medium">
                  {pagination.currentPage} / {pagination.totalPages}
                </span>

                <button
                  type="button"
                  disabled={pagination.currentPage >= pagination.totalPages}
                  onClick={() => changePage(pagination.currentPage + 1)}
                  className="rounded-lg border border-[#e8ded1] p-2 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </section>

        <p className="mt-5 text-center text-xs text-[#a49a91]">
          WedPlan Admin · Transaction records are displayed for monitoring only.
        </p>
      </div>

      {selectedTransaction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedTransaction(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-details-title"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#eee5dc] p-5">
              <div>
                <h2
                  id="transaction-details-title"
                  className="text-xl font-bold"
                >
                  Transaction details
                </h2>
                <p className="mt-1 text-xs text-[#81777a]">
                  Read-only transaction information
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                className="rounded-lg p-2 text-[#81777a] hover:bg-[#f5eee6]"
                aria-label="Close transaction details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="rounded-xl bg-[#faf8f5] p-4">
                <p className="text-xs text-[#81777a]">Transaction amount</p>
                <p className="mt-2 text-2xl font-bold">
                  {formatAmount(
                    selectedTransaction.amount,
                    selectedTransaction.currency
                  )}
                </p>
                <span
                  className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                    statusStyles[selectedTransaction.status]
                  }`}
                >
                  {selectedTransaction.status}
                </span>
              </div>

              <section className="rounded-xl border border-[#e8ded1] bg-[#fdfbf9] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#3f3039]">
                    Payment card
                  </h3>
                  <CreditCard size={19} className="text-[#9a7045]" />
                </div>
                {selectedTransaction.paymentMethod ? (
                  <>
                    <p className="text-lg font-semibold tracking-wider text-[#3f3039]">
                      •••• •••• •••• {selectedTransaction.paymentMethod.last4}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-[#81777a]">Card brand</p>
                        <p className="mt-1 font-medium capitalize">
                          {selectedTransaction.paymentMethod.brand}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#81777a]">Expiry date</p>
                        <p className="mt-1 font-medium">
                          {String(selectedTransaction.paymentMethod.expMonth).padStart(2, "0")}/{selectedTransaction.paymentMethod.expYear}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-[#81777a]">
                    Card details are not available for this transaction. They may not have been collected for older payments or the payment method may not be a card.
                  </p>
                )}
                <p className="mt-3 text-xs leading-5 text-[#81777a]">
                  Only masked card details are stored. Full card numbers and security codes are never available to WedPlan.
                </p>
              </section>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["Vendor", selectedTransaction.vendor?.businessName || selectedTransaction.vendor?.name || "Unknown vendor"],
                  ["Vendor email", selectedTransaction.vendor?.email || "Unavailable"],
                  ["Subscription plan", selectedTransaction.plan],
                  ["Transaction type", selectedTransaction.type || "initial"],
                  ["Created at", formatDate(selectedTransaction.createdAt)],
                  ["Last updated", formatDate(selectedTransaction.updatedAt)],
                  ["Paid at", formatDate(selectedTransaction.paidAt)],
                  ["Vendor ID", selectedTransaction.vendorId],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <p className="text-xs text-[#81777a]">{label}</p>
                    <p className="mt-1 break-all text-sm font-medium capitalize">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t border-[#eee5dc] pt-4">
                <div>
                  <p className="text-xs text-[#81777a]">
                    Stripe Checkout Session ID
                  </p>
                  <p className="mt-1 break-all text-xs font-medium">
                    {selectedTransaction.stripeSessionId || "Not available"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#81777a]">
                    Stripe Subscription ID
                  </p>
                  <p className="mt-1 break-all text-xs font-medium">
                    {selectedTransaction.stripeSubscriptionId || "Not available"}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-[#e8ded1] bg-[#fdfbf9] p-4 text-xs leading-5 text-[#665b55]">
                Administrators can inspect transaction records but cannot
                manually change payment status or activate a subscription.
                Payment status must be updated through verified payment
                processing on the backend.
              </div>
            </div>

            <div className="border-t border-[#eee5dc] p-5">
              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                className="w-full rounded-xl bg-[#9a7045] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#805b37]"
              >
                Close details
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

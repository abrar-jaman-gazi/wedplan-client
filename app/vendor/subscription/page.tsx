
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Crown,
  CreditCard,
  History,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface SubscriptionData {
  plan: "free" | "premium";
  storedPlan: string;
  status: string;
  paymentStatus: string;
  isPremiumActive: boolean;
  expiresAt: string | null;
  premium: {
    name: string;
    amount: number;
    currency: string;
    interval: string;
    features: string[];
  };
}

interface Transaction {
  _id: string;
  plan: string;
  type?: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
}

interface SubscriptionResponse {
  success: boolean;
  data?: SubscriptionData;
  message?: string;
}

interface TransactionsResponse {
  success: boolean;
  data?: Transaction[];
  pagination?: {
    page: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

interface TokenResponse {
  token?: string;
  message?: string;
}

const formatDate = (value: string | null) => {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

const formatPrice = (amount: number, currency: string) => {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 2,
  }).format(amount);
};

const statusStyles: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  failed: "bg-red-50 text-red-700",
  cancelled: "bg-slate-100 text-slate-600",
  expired: "bg-slate-100 text-slate-600",
  refunded: "bg-blue-50 text-blue-700",
};

export default function VendorSubscriptionPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [subscription, setSubscription] =
    useState<SubscriptionData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [notice, setNotice] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);

  const loadSubscriptionData = useCallback(async () => {
    if (!API_URL) {
      setError("The API URL is not configured.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const tokenResponse = await fetch(`${API_URL}/auth/token`, {
        method: "GET",
        credentials: "include",
      });

      const tokenResult =
        (await tokenResponse.json()) as TokenResponse;

      if (!tokenResponse.ok || !tokenResult.token) {
        throw new Error(
          tokenResult.message ||
            "Unable to authenticate your request."
        );
      }

      const headers = {
        Authorization: `Bearer ${tokenResult.token}`,
      };

      const [subscriptionResponse, transactionsResponse] =
        await Promise.all([
          fetch(`${API_URL}/stripe/subscription`, {
            method: "GET",
            headers,
            cache: "no-store",
          }),
          fetch(
            `${API_URL}/stripe/transactions?page=${currentPage}&limit=10`,
            {
              method: "GET",
              headers,
              cache: "no-store",
            }
          ),
        ]);

      const subscriptionResult =
        (await subscriptionResponse.json()) as SubscriptionResponse;

      const transactionsResult =
        (await transactionsResponse.json()) as TransactionsResponse;

      if (!subscriptionResponse.ok || !subscriptionResult.success) {
        throw new Error(
          subscriptionResult.message ||
            "Unable to load subscription information."
        );
      }

      if (!transactionsResponse.ok || !transactionsResult.success) {
        throw new Error(
          transactionsResult.message ||
            "Unable to load transaction history."
        );
      }

      setSubscription(subscriptionResult.data || null);
      setTransactions(transactionsResult.data || []);
      setTotalPages(
        Math.max(1, transactionsResult.pagination?.totalPages || 1)
      );
      setTotalTransactions(
        transactionsResult.pagination?.total || 0
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading subscription details."
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    if (isPending) return;

    if (!session) {
      router.replace("/sign-in");
      return;
    }

    if (session.user.role !== "vendor") {
      if (session.user.role === "admin") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/customer/dashboard");
      }
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");

    if (payment === "success") {
      setNotice(
        "Checkout completed. Your Premium subscription will appear after Stripe verifies the payment."
      );
    } else if (payment === "cancelled") {
      setNotice("You cancelled the checkout. No subscription was activated.");
    }

    void loadSubscriptionData();
  }, [isPending, session, router, loadSubscriptionData]);

  const handleCheckout = async () => {
    if (!API_URL) {
      setCheckoutError("The API URL is not configured.");
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError("");

    try {
      const tokenResponse = await fetch(`${API_URL}/auth/token`, {
        method: "GET",
        credentials: "include",
      });

      const tokenResult =
        (await tokenResponse.json()) as TokenResponse;

      if (!tokenResponse.ok || !tokenResult.token) {
        throw new Error(
          tokenResult.message ||
            "Unable to authenticate your request."
        );
      }

      const response = await fetch(`${API_URL}/stripe/checkout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenResult.token}`,
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success || !result.data?.checkoutUrl) {
        throw new Error(
          result.message || "Unable to start Stripe Checkout."
        );
      }

      window.location.assign(result.data.checkoutUrl);
    } catch (err) {
      setCheckoutError(
        err instanceof Error
          ? err.message
          : "Unable to start checkout. Please try again."
      );
      setCheckoutLoading(false);
    }
  };

  if (
    isPending ||
    !session ||
    session.user.role !== "vendor"
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf8f5]">
        <LoaderCircle className="animate-spin text-[#9a7045]" size={32} />
      </main>
    );
  }

  if (loading && !subscription) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf8f5]">
        <div className="text-center">
          <LoaderCircle
            className="mx-auto animate-spin text-[#9a7045]"
            size={36}
          />
          <p className="mt-4 text-sm text-[#81777a]">
            Loading your subscription...
          </p>
        </div>
      </main>
    );
  }

  if (error && !subscription) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf8f5] px-5">
        <div className="w-full max-w-md rounded-2xl border border-[#eee5dc] bg-white p-8 text-center shadow-sm">
          <XCircle className="mx-auto text-red-500" size={38} />
          <h1 className="mt-4 text-xl font-bold text-[#49313e]">
            Unable to load subscription
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#81777a]">
            {error}
          </p>
          <button
            onClick={() => void loadSubscriptionData()}
            className="mt-6 rounded-xl bg-[#49313e] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#604354]"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  if (!subscription) return null;

  const isPremium = subscription.isPremiumActive;
  const premium = subscription.premium;

  return (
    <main className="min-h-screen bg-[#faf8f5]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/vendor/dashboard"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#9a7045] transition hover:text-[#49313e]"
            >
              <ArrowLeft size={17} />
              Back to dashboard
            </Link>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#49313e] sm:text-4xl">
              Subscription
            </h1>
            <p className="mt-2 text-sm text-[#81777a]">
              Manage your WedPlan business subscription.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadSubscriptionData()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#e9dfd4] bg-white px-4 py-3 text-sm font-semibold text-[#49313e] transition hover:bg-[#f7f1e9] disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {notice && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#e8d6b9] bg-[#fff9ed] p-4 text-sm leading-6 text-[#795a32]">
            <CheckCircle2 className="mt-0.5 shrink-0" size={19} />
            <p>{notice}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
          <div className="overflow-hidden rounded-3xl border border-[#eee5dc] bg-white shadow-sm">
            <div className="bg-gradient-to-br from-[#49313e] to-[#745365] p-6 text-white sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-[#eadbc9]">
                    <Crown size={18} />
                    YOUR CURRENT PLAN
                  </div>
                  <h2 className="mt-3 text-3xl font-bold capitalize">
                    {subscription.plan} Plan
                  </h2>
                  <p className="mt-2 text-sm text-[#e9dfe2]">
                    {isPremium
                      ? "You have access to WedPlan Premium benefits."
                      : "You are currently using the free vendor plan."}
                  </p>
                </div>

                <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-bold capitalize text-white">
                  {subscription.status.replaceAll("_", " ")}
                </span>
              </div>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
              <div className="rounded-2xl bg-[#faf8f5] p-5">
                <div className="flex items-center gap-2 text-sm text-[#81777a]">
                  <ShieldCheck size={17} className="text-[#a47d50]" />
                  Payment status
                </div>
                <p className="mt-3 text-xl font-bold capitalize text-[#49313e]">
                  {subscription.paymentStatus.replaceAll("_", " ")}
                </p>
              </div>

              <div className="rounded-2xl bg-[#faf8f5] p-5">
                <div className="flex items-center gap-2 text-sm text-[#81777a]">
                  <Clock size={17} className="text-[#a47d50]" />
                  Valid until
                </div>
                <p className="mt-3 text-base font-bold text-[#49313e]">
                  {isPremium
                    ? formatDate(subscription.expiresAt)
                    : "No expiry date"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[#e8d6b9] bg-white p-6 shadow-sm sm:p-7">
            <div className="flex items-center gap-2 text-[#9a7045]">
              <Sparkles size={19} />
              <span className="text-sm font-bold uppercase tracking-wider">
                Premium membership
              </span>
            </div>

            <h2 className="mt-4 text-2xl font-bold text-[#49313e]">
              {premium.name}
            </h2>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-[#49313e]">
                {formatPrice(premium.amount, premium.currency)}
              </span>
              <span className="text-sm text-[#81777a]">
                / {premium.interval}
              </span>
            </div>

            <div className="my-6 h-px bg-[#eee5dc]" />

            <h3 className="text-sm font-bold text-[#49313e]">
              Premium benefits
            </h3>

            <ul className="mt-4 space-y-3">
              {premium.features.map((feature, index) => (
                <li
                  key={`${feature}-${index}`}
                  className="flex items-start gap-3 text-sm leading-6 text-[#665a60]"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f2e8d9] text-[#9a7045]">
                    <Check size={13} />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>

            {isPremium ? (
              <div className="mt-7 rounded-xl bg-emerald-50 p-4 text-center text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="mx-auto mb-2" size={23} />
                Your Premium subscription is active.
              </div>
            ) : (
              <>
                {checkoutError && (
                  <div className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    {checkoutError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-[#49313e] px-5 py-4 text-sm font-bold text-white transition hover:bg-[#604354] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {checkoutLoading ? (
                    <>
                      <LoaderCircle className="animate-spin" size={18} />
                      Preparing secure checkout...
                    </>
                  ) : (
                    <>
                      <Crown size={18} />
                      Upgrade to Premium
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>

                <p className="mt-3 text-center text-xs leading-5 text-[#a39799]">
                  Secure payment powered by Stripe. Your plan activates only
                  after payment verification.
                </p>
              </>
            )}
          </div>
        </section>

        <section className="mt-9 overflow-hidden rounded-3xl border border-[#eee5dc] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#eee5dc] p-6 sm:px-8">
            <div>
              <div className="flex items-center gap-2">
                <History size={20} className="text-[#9a7045]" />
                <h2 className="text-xl font-bold text-[#49313e]">
                  Payment history
                </h2>
              </div>
              <p className="mt-1 text-sm text-[#81777a]">
                Your subscription payment records.
              </p>
            </div>

            <span className="rounded-full bg-[#f6eee4] px-4 py-2 text-xs font-bold text-[#9a7045]">
              {totalTransactions} transactions
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f6eee4] text-[#9a7045]">
                <CreditCard size={25} />
              </span>
              <h3 className="mt-4 text-base font-bold text-[#49313e]">
                No transactions yet
              </h3>
              <p className="mt-2 text-sm text-[#81777a]">
                Your subscription payment history will appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left">
                  <thead className="bg-[#faf8f5] text-xs uppercase tracking-wider text-[#81777a]">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Date</th>
                      <th className="px-6 py-4 font-semibold">Plan</th>
                      <th className="px-6 py-4 font-semibold">Type</th>
                      <th className="px-6 py-4 font-semibold">Amount</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eee5dc]">
                    {transactions.map((transaction) => (
                      <tr key={transaction._id}>
                        <td className="px-6 py-5 text-sm text-[#665a60]">
                          {formatDate(transaction.createdAt)}
                        </td>
                        <td className="px-6 py-5 text-sm font-semibold capitalize text-[#49313e]">
                          {transaction.plan}
                        </td>
                        <td className="px-6 py-5 text-sm capitalize text-[#665a60]">
                          {transaction.type || "Initial"}
                        </td>
                        <td className="px-6 py-5 text-sm font-bold text-[#49313e]">
                          {formatPrice(
                            transaction.amount,
                            transaction.currency
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${
                              statusStyles[transaction.status] ||
                              "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 p-4 md:hidden">
                {transactions.map((transaction) => (
                  <div
                    key={transaction._id}
                    className="rounded-2xl border border-[#eee5dc] bg-[#fcfaf7] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold capitalize text-[#49313e]">
                          {transaction.plan} subscription
                        </p>
                        <p className="mt-1 text-xs text-[#81777a]">
                          {formatDate(transaction.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                          statusStyles[transaction.status] ||
                          "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs capitalize text-[#81777a]">
                        {transaction.type || "Initial"}
                      </span>
                      <span className="font-bold text-[#49313e]">
                        {formatPrice(
                          transaction.amount,
                          transaction.currency
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eee5dc] px-6 py-5">
                <p className="text-xs text-[#81777a]">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={currentPage <= 1 || loading}
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                    className="rounded-lg border border-[#e9dfd4] px-4 py-2 text-sm font-semibold text-[#49313e] transition hover:bg-[#faf8f5] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages || loading}
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.min(totalPages, page + 1)
                      )
                    }
                    className="rounded-lg border border-[#e9dfd4] px-4 py-2 text-sm font-semibold text-[#49313e] transition hover:bg-[#faf8f5] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#eee5dc] bg-white p-5">
          <ShieldCheck className="mt-0.5 shrink-0 text-[#9a7045]" size={21} />
          <div>
            <h3 className="text-sm font-bold text-[#49313e]">
              Secure subscription management
            </h3>
            <p className="mt-1 text-xs leading-5 text-[#81777a]">
              Payment records are displayed for reference. Subscription
              activation and payment status are controlled by verified
              Stripe webhook events on the WedPlan server.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

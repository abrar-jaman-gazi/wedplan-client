"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
  XCircle,
  X,
  Heart,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
type BookingStatus = "pending" | "accepted" | "rejected" | "cancelled";
interface Booking {
  _id: string;
  serviceId: string;
  serviceName: string;
  serviceCategory?: string;
  servicePrice?: number;
  vendorName?: string;
  eventDate: string;
  eventLocation: string;
  message?: string;
  status: BookingStatus;
  createdAt?: string;
}
interface BookingsResponse {
  success: boolean;
  message?: string;
  count?: number;
  data?: Booking[] | { bookings?: Booking[]; items?: Booking[] };
}
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const statusStyles: Record<BookingStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  accepted: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
  cancelled: "bg-gray-100 text-gray-600",
};
const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};
const formatPrice = (price?: number) => {
  if (typeof price !== "number") return "Price unavailable";
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(price);
};
export default function CustomerBookingsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [cancellingId, setCancellingId] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | BookingStatus>("all");
  const user = session?.user;
  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.replace("/sign-in");
      return;
    }
    if (user?.role === "vendor") {
      router.replace("/vendor/dashboard");
    } else if (user?.role === "admin") {
      router.replace("/admin/dashboard");
    }
  }, [isPending, session, user?.role, router]);
  const loadBookings = useCallback(async () => {
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
      const tokenResult = (await tokenResponse.json()) as {
        token?: string;
        message?: string;
      };
      if (!tokenResponse.ok || !tokenResult.token) {
        throw new Error(
          tokenResult.message || "Unable to authenticate your request."
        );
      }
      const response = await fetch(`${API_URL}/bookings/mine`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${tokenResult.token}`,
        },
      });
      const result = (await response.json()) as BookingsResponse;
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load your bookings.");
      }
      const returnedData = result.data;
      const bookingList = Array.isArray(returnedData)
        ? returnedData
        : returnedData?.bookings || returnedData?.items || [];
      setBookings(bookingList);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading bookings."
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (!isPending && user?.role === "customer") {
      void loadBookings();
    }
  }, [isPending, user?.id, user?.role, loadBookings]);
  const cancelBooking = async (bookingId: string) => {
    if (!API_URL) {
      setActionError("The API URL is not configured.");
      return;
    }
    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking request?"
    );
    if (!confirmed) return;
    setCancellingId(bookingId);
    setActionError("");
    try {
      const tokenResponse = await fetch(`${API_URL}/auth/token`, {
        method: "GET",
        credentials: "include",
      });
      const tokenResult = (await tokenResponse.json()) as {
        token?: string;
        message?: string;
      };
      if (!tokenResponse.ok || !tokenResult.token) {
        throw new Error(
          tokenResult.message || "Unable to authenticate your request."
        );
      }
      const response = await fetch(
        `${API_URL}/bookings/${encodeURIComponent(bookingId)}/cancel`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${tokenResult.token}`,
          },
        }
      );
      const result = (await response.json()) as {
        success?: boolean;
        message?: string;
      };
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to cancel this booking.");
      }
      await loadBookings();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to cancel this booking."
      );
    } finally {
      setCancellingId("");
    }
  };
  const counts = {
    total: bookings.length,
    pending: bookings.filter((booking) => booking.status === "pending").length,
    accepted: bookings.filter((booking) => booking.status === "accepted").length,
    rejected: bookings.filter((booking) => booking.status === "rejected").length,
    cancelled: bookings.filter((booking) => booking.status === "cancelled").length,
  };

  const filters: { label: string; value: "all" | BookingStatus; count: number }[] = [
    { label: "All", value: "all", count: counts.total },
    { label: "Pending", value: "pending", count: counts.pending },
    { label: "Accepted", value: "accepted", count: counts.accepted },
    { label: "Rejected", value: "rejected", count: counts.rejected },
    { label: "Cancelled", value: "cancelled", count: counts.cancelled },
  ];

  const filteredBookings =
    activeFilter === "all"
      ? bookings
      : bookings.filter((booking) => booking.status === activeFilter);
  if (isPending || !user || user.role !== "customer") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf8f5]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#e8ded1] border-t-[#9a7045]" />
          <p className="mt-4 text-sm text-[#81777a]">
            Loading your bookings...
          </p>
        </div>
      </main>
    );
  }
  return (
    <main className="min-h-screen bg-[#faf8f5] px-5 py-8 text-[#49313e] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <Link href="/customer/dashboard" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2e8d9] text-[#9a7045]">
              <Heart size={20} fill="currentColor" />
            </span>
            <span className="text-xl font-bold">WedPlan</span>
          </Link>
          <Link
href="/customer/dashboard"
className="inline-flex items-center gap-2 text-sm font-semibold text-[#81777a] hover:text-[#49313e]"
          >
            <ArrowLeft size={17} />
            Back to dashboard
          </Link>
        </header>
        <section className="mb-9 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#a47d50]">
              Customer workspace
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[#34232e] sm:text-4xl">
              My Bookings
            </h1>
            <p className="mt-3 text-sm text-[#81777a] sm:text-base">
              Keep track of your wedding service requests and their status.
            </p>
          </div>
          <button
type="button"
onClick={() => void loadBookings()}
disabled={loading}
className="inline-flex items-center gap-2 rounded-xl border border-[#e9ded3] bg-white px-5 py-3 text-sm font-semibold transition hover:bg-[#f8f3ed] disabled:opacity-50"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </section>
        <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Total bookings", value: counts.total, icon: CalendarDays },
            { label: "Pending", value: counts.pending, icon: Clock },
            { label: "Accepted", value: counts.accepted, icon: CheckCircle2 },
            { label: "Rejected", value: counts.rejected, icon: XCircle },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
key={item.label}
className="rounded-2xl border border-[#eee5dc] bg-white p-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-[#81777a]">{item.label}</p>
                  <Icon size={19} className="text-[#a47d50]" />
                </div>
                <p className="mt-3 text-3xl font-semibold text-[#49313e]">
                  {item.value}
                </p>
              </div>
            );
          })}
        </section>
        {error && (
          <div
role="alert"
className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
            <button
type="button"
onClick={() => void loadBookings()}
className="ml-3 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}
        {actionError && (
          <div
role="alert"
className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <span>{actionError}</span>
            <button
type="button"
onClick={() => setActionError("")}
aria-label="Dismiss error"
            >
              <X size={17} />
            </button>
          </div>
        )}
        {loading ? (
          <div className="rounded-2xl border border-[#eee5dc] bg-white py-16 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#e8ded1] border-t-[#9a7045]" />
            <p className="mt-4 text-sm text-[#81777a]">
              Loading your booking requests...
            </p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-2xl border border-[#eee5dc] bg-white px-6 py-16 text-center">
            <CalendarDays size={38} className="mx-auto text-[#a47d50]" />
            <h2 className="mt-4 text-xl font-semibold text-[#34232e]">
              No bookings yet
            </h2>
            <p className="mt-2 text-sm text-[#81777a]">
              Explore wedding services and send your first booking request.
            </p>
            <Link
href="/services"
className="mt-6 inline-flex items-center rounded-xl bg-[#49313e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#604354]"
            >
              Explore services
            </Link>
          </div>
        ) : (
          <section className="space-y-5">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter bookings by status">
            {filters.map((filter) => {
              const isActive = activeFilter === filter.value;

              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setActiveFilter(filter.value)}
                  aria-pressed={isActive}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "border-[#49313e] bg-[#49313e] text-white"
                      : "border-[#e9ded3] bg-white text-[#81777a] hover:border-[#cbb59d] hover:bg-[#f8f3ed]"
                  }`}
                >
                  {filter.label}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      isActive ? "bg-white/15 text-white" : "bg-[#f2e8d9] text-[#8b6847]"
                    }`}
                  >
                    {filter.count}
                  </span>
                </button>
              );
            })}
          </div>

          {filteredBookings.length === 0 ? (
            <div className="rounded-2xl border border-[#eee5dc] bg-white px-6 py-12 text-center">
              <CalendarDays size={32} className="mx-auto text-[#a47d50]" />
              <h2 className="mt-4 text-lg font-semibold text-[#34232e]">
                No {activeFilter === "all" ? "" : `${activeFilter} `}bookings found
              </h2>
              <p className="mt-2 text-sm text-[#81777a]">
                {activeFilter === "all"
                  ? "There are no booking requests to display."
                  : `You do not have any ${activeFilter} bookings right now.`}
              </p>
              {activeFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  className="mt-5 rounded-xl bg-[#49313e] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#604354]"
                >
                  Show all bookings
                </button>
              )}
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <article
key={booking._id}
className="rounded-2xl border border-[#eee5dc] bg-white p-5 shadow-sm sm:p-7"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-[#34232e]">
                      {booking.serviceName}
                    </h2>
                    <p className="mt-1 text-sm text-[#9b8e90]">
                      {booking.serviceCategory || "Wedding service"}
                    </p>
                  </div>
                  <span
className={`rounded-full px-4 py-2 text-xs font-semibold capitalize ${statusStyles[booking.status]}`}
                  >
                    {booking.status}
                  </span>
                </div>
                <div className="mt-6 grid gap-5 border-b border-[#eee5dc] pb-6 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-[#9b8e90]">Event date</p>
                    <p className="mt-2 flex items-center gap-2 text-sm font-medium">
                      <CalendarDays size={17} className="text-[#a47d50]" />
                      {formatDate(booking.eventDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#9b8e90]">Event location</p>
                    <p className="mt-2 flex items-center gap-2 text-sm font-medium">
                      <MapPin size={17} className="text-[#a47d50]" />
                      {booking.eventLocation}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#9b8e90]">Vendor</p>
                    <p className="mt-2 text-sm font-medium">
                      {booking.vendorName || "Wedding professional"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#9b8e90]">Requested service price</p>
                    <p className="mt-2 text-sm font-semibold">
                      {formatPrice(booking.servicePrice)}
                    </p>
                  </div>
                </div>
                {booking.message && (
                  <div className="mt-5 rounded-xl bg-[#faf8f5] p-4">
                    <p className="text-xs font-semibold text-[#49313e]">
                      Your message
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#81777a]">
                      {booking.message}
                    </p>
                  </div>
                )}
                {booking.createdAt && (
                  <p className="mt-4 text-xs text-[#a39799]">
                    Requested on {formatDate(booking.createdAt)}
                  </p>
                )}
                {booking.status === "pending" && (
                  <div className="mt-5 flex justify-end">
                    <button
type="button"
onClick={() => void cancelBooking(booking._id)}
disabled={cancellingId === booking._id}
className="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {cancellingId === booking._id
                        ? "Cancelling..."
                        : "Cancel booking"}
                    </button>
                  </div>
                )}
              </article>
            ))
          )}
          </section>
        )}
      </div>
    </main>
  );
}

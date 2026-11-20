"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  LoaderCircle,
  LogOut,
  MapPin,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { signOut, useSession } from "@/lib/auth-client";

interface Booking {
  _id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  serviceId: string;
  serviceName: string;
  serviceCategory: string;
  servicePrice: number;
  eventDate: string;
  eventLocation: string;
  message: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  createdAt: string;
}

interface BookingsResponse {
  success: boolean;
  count?: number;
  data?: Booking[];
  message?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const statusStyles: Record<Booking["status"], string> = {
  pending: "bg-amber-50 text-amber-700",
  accepted: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
  cancelled: "bg-gray-100 text-gray-600",
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(price);

const formatDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

export default function VendorBookingsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionBookingId, setActionBookingId] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  const user = session?.user;

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.replace("/sign-in");
      return;
    }
    if (user?.role === "customer") router.replace("/customer/dashboard");
    if (user?.role === "admin") router.replace("/admin/dashboard");
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
        throw new Error(tokenResult.message || "Unable to authenticate your request.");
      }

      const response = await fetch(`${API_URL}/bookings/vendor`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${tokenResult.token}`,
        },
      });
      const result = (await response.json()) as BookingsResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load booking requests.");
      }

      setBookings(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load booking requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isPending && user?.role === "vendor") void loadBookings();
  }, [isPending, user?.id, user?.role, loadBookings]);

  const updateStatus = async (bookingId: string, status: "accepted" | "rejected") => {
    if (!API_URL) {
      setActionError("The API URL is not configured.");
      return;
    }

    setActionBookingId(bookingId);
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
        throw new Error(tokenResult.message || "Unable to authenticate your request.");
      }

      const response = await fetch(
        `${API_URL}/bookings/${encodeURIComponent(bookingId)}/status`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokenResult.token}`,
          },
          body: JSON.stringify({ status }),
        }
      );
      const result = (await response.json()) as { success?: boolean; message?: string };

      if (!response.ok || !result.success) {
        throw new Error(result.message || `Unable to ${status} this booking.`);
      }

      await loadBookings();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : `Unable to ${status} this booking.`);
    } finally {
      setActionBookingId("");
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    const result = await signOut();
    if (result.error) {
      setActionError(result.error.message || "Unable to sign out.");
      setSigningOut(false);
      return;
    }
    router.replace("/sign-in");
    router.refresh();
  };

  if (isPending || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf8f5]">
        <LoaderCircle size={34} className="animate-spin text-[#9a7045]" />
      </main>
    );
  }

  if (user.role !== "vendor") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf8f5] px-5">
        <div className="max-w-md rounded-2xl border border-[#eee5dc] bg-white p-8 text-center">
          <ShieldCheck size={36} className="mx-auto text-[#a47d50]" />
          <h1 className="mt-4 text-xl font-semibold text-[#34232e]">Vendor access required</h1>
          <Link href="/" className="mt-5 inline-block rounded-xl bg-[#49313e] px-5 py-3 text-sm font-semibold text-white">Return home</Link>
        </div>
      </main>
    );
  }

  const pendingCount = bookings.filter((booking) => booking.status === "pending").length;

  return (
    <main className="min-h-screen bg-[#faf8f5] text-[#49313e]">
      <header className="border-b border-[#eee5dc] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/vendor/dashboard" className="text-xl font-bold">WedPlan</Link>
          <button type="button" onClick={handleSignOut} disabled={signingOut} className="inline-flex items-center gap-2 text-sm text-[#81777a] hover:text-red-600 disabled:opacity-50">
            <LogOut size={17} /> {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <Link href="/vendor/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-[#9a7045] hover:text-[#49313e]">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a47d50]">Vendor workspace</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#34232e]">Booking requests</h1>
            <p className="mt-2 text-sm text-[#81777a]">Review customer requests and respond to pending bookings.</p>
          </div>
          <button type="button" onClick={() => void loadBookings()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-[#e9e1d9] bg-white px-4 py-3 text-sm font-semibold hover:bg-[#fcfaf7] disabled:opacity-50">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        <section className="mt-7 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#eee5dc] bg-white p-5">
            <p className="text-xs text-[#81777a]">Total requests</p>
            <p className="mt-2 text-3xl font-bold">{bookings.length}</p>
          </div>
          <div className="rounded-2xl border border-[#eee5dc] bg-white p-5">
            <p className="text-xs text-[#81777a]">Pending</p>
            <p className="mt-2 text-3xl font-bold">{pendingCount}</p>
          </div>
          <div className="rounded-2xl border border-[#eee5dc] bg-white p-5">
            <p className="text-xs text-[#81777a]">Accepted</p>
            <p className="mt-2 text-3xl font-bold">{bookings.filter((booking) => booking.status === "accepted").length}</p>
          </div>
        </section>

        {actionError && (
          <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</div>
        )}

        {loading ? (
          <div className="mt-8 flex items-center justify-center rounded-2xl border border-[#eee5dc] bg-white py-16">
            <LoaderCircle size={25} className="animate-spin text-[#9a7045]" />
            <span className="ml-3 text-sm text-[#81777a]">Loading booking requests...</span>
          </div>
        ) : error ? (
          <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-700">
            {error}
            <button type="button" onClick={() => void loadBookings()} className="mt-3 block w-full font-semibold underline">Try again</button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-[#e6ded8] bg-white px-5 py-16 text-center">
            <ClipboardList size={34} className="mx-auto text-[#a47d50]" />
            <h2 className="mt-4 text-lg font-semibold">No booking requests yet</h2>
            <p className="mt-2 text-sm text-[#81777a]">Customer requests for your approved services will appear here.</p>
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {bookings.map((booking) => (
              <article key={booking._id} className="rounded-2xl border border-[#eee5dc] bg-white p-5 shadow-sm sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-[#34232e]">{booking.serviceName}</h2>
                    <p className="mt-1 text-xs text-[#a39799]">{booking.serviceCategory} · {formatPrice(booking.servicePrice)}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${statusStyles[booking.status] || statusStyles.pending}`}>{booking.status}</span>
                </div>

                <div className="mt-5 grid gap-4 border-t border-[#f0e9e2] pt-5 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-[#a39799]">Customer</p>
                    <p className="mt-1 text-sm font-semibold">{booking.customerName}</p>
                    <p className="mt-1 text-xs text-[#81777a]">{booking.customerEmail}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#a39799]">Event date</p>
                    <p className="mt-1 flex items-center gap-2 text-sm font-medium"><CalendarDays size={16} className="text-[#9a7045]" />{formatDate(booking.eventDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#a39799]">Event location</p>
                    <p className="mt-1 flex items-center gap-2 text-sm font-medium"><MapPin size={16} className="text-[#9a7045]" />{booking.eventLocation}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#a39799]">Requested service price</p>
                    <p className="mt-1 text-sm font-semibold">{formatPrice(booking.servicePrice)}</p>
                  </div>
                </div>

                {booking.message && (
                  <div className="mt-5 rounded-xl bg-[#faf8f5] p-4">
                    <p className="text-xs font-semibold text-[#49313e]">Customer message</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#81777a]">{booking.message}</p>
                  </div>
                )}

                {booking.status === "pending" && (
                  <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-[#f0e9e2] pt-5">
                    <button type="button" onClick={() => void updateStatus(booking._id, "rejected")} disabled={actionBookingId === booking._id} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50">
                      <XCircle size={17} /> {actionBookingId === booking._id ? "Processing..." : "Reject"}
                    </button>
                    <button type="button" onClick={() => void updateStatus(booking._id, "accepted")} disabled={actionBookingId === booking._id} className="inline-flex items-center gap-2 rounded-xl bg-[#49313e] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#604354] disabled:opacity-50">
                      <CheckCircle2 size={17} /> {actionBookingId === booking._id ? "Processing..." : "Accept"}
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

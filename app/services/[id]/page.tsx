
"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  LoaderCircle,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wallet,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";

interface Service {
  _id: string;
  vendorId: string;
  serviceName: string;
  category: string;
  description: string;
  price: number;
  location: string;
  images: string[];
  status: string;
  approvalStatus: string;
  vendor: {
    _id: string;
    name: string;
    email?: string;
    businessName?: string;
  };
}

interface ServiceResponse {
  success: boolean;
  data: Service;
  message?: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: unknown;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(price);

const getToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getErrorMessage = async (response: Response) => {
  try {
    const result = (await response.json()) as ApiResponse;
    return result.message || "Something went wrong. Please try again.";
  } catch {
    return "Something went wrong. Please try again.";
  }
};

function ServiceDetailsContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();

  const serviceId = params.id;

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState("");

  const user = session?.user;
  const userRole = user?.role;

  const loadService = useCallback(
    async (signal: AbortSignal) => {
      if (!API_URL) {
        setLoadError("The API URL is not configured.");
        setLoading(false);
        return;
      }

      if (!serviceId) {
        setLoadError("The service ID is missing.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError("");

      try {
        const response = await fetch(
          `${API_URL}/services/${encodeURIComponent(serviceId)}`,
          {
            method: "GET",
            signal,
            cache: "no-store",
          }
        );

        const result = (await response.json()) as ServiceResponse;

        if (!response.ok || !result.success || !result.data) {
          throw new Error(
            result.message || "Unable to load this wedding service."
          );
        }

        setService(result.data);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setLoadError(
          error instanceof Error
            ? error.message
            : "Unable to load this wedding service."
        );
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [serviceId]
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadService(controller.signal);

    return () => controller.abort();
  }, [loadService]);

  const handleBooking = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setBookingError("");
    setBookingSuccess("");

    if (!user) {
      router.push("/sign-in");
      return;
    }

    if (userRole !== "customer") {
      setBookingError("Only customer accounts can request a booking.");
      return;
    }

    if (!service) {
      setBookingError("Service information is unavailable.");
      return;
    }

    if (service.vendorId === user.id) {
      setBookingError("You cannot book your own service.");
      return;
    }

    if (!API_URL) {
      setBookingError("The API URL is not configured.");
      return;
    }

    setSubmitting(true);

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

      const response = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenResult.token}`,
        },
        body: JSON.stringify({
          serviceId: service._id,
          eventDate,
          eventLocation: eventLocation.trim(),
          message: message.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const result = (await response.json()) as ApiResponse;

      if (!result.success) {
        throw new Error(
          result.message || "Unable to submit your booking."
        );
      }

      setBookingSuccess(
        result.message ||
          "Your booking request has been submitted successfully."
      );

      setEventDate("");
      setEventLocation("");
      setMessage("");
    } catch (error) {
      setBookingError(
        error instanceof Error
          ? error.message
          : "Unable to submit your booking. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || sessionPending) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf8f5]">
        <div className="text-center">
          <LoaderCircle
            className="mx-auto animate-spin text-[#9a7045]"
            size={38}
          />
          <p className="mt-4 text-sm text-[#81777a]">
            Loading service details...
          </p>
        </div>
      </main>
    );
  }

  if (loadError || !service) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf8f5] px-5">
        <div className="max-w-md rounded-2xl border border-[#eee5dc] bg-white p-8 text-center shadow-sm">
          <Sparkles className="mx-auto text-[#a47d50]" size={38} />

          <h1 className="mt-4 text-xl font-semibold text-[#34232e]">
            Service unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#81777a]">
            {loadError || "This service could not be found."}
          </p>

          <Link
            href="/services"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#49313e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#604354]"
          >
            <ArrowLeft size={16} />
            Browse services
          </Link>
        </div>
      </main>
    );
  }

  const isCustomer = userRole === "customer";
  const isVendor = userRole === "vendor";
  const isOwnService = Boolean(user && user.id === service.vendorId);

  return (
    <main className="min-h-screen bg-[#faf8f5] text-[#49313e]">
      <header className="border-b border-[#eee5dc] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2e8d9] text-[#9a7045]">
              <Sparkles size={20} />
            </span>

            <span className="text-xl font-bold tracking-tight">
              WedPlan
            </span>
          </Link>

          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#81777a] transition hover:text-[#49313e]"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Browse services</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a47d50]">
            WedPlan marketplace
          </p>

          <h1 className="mt-2 text-3xl font-semibold text-[#34232e] sm:text-4xl">
            Service details
          </h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <section className="space-y-6">
            <div className="overflow-hidden rounded-3xl border border-[#eee5dc] bg-white shadow-sm">
              {service.images?.[0] ? (
                <img
                  src={service.images[0]}
                  alt={service.serviceName}
                  className="h-72 w-full object-cover sm:h-[420px]"
                />
              ) : (
                <div className="flex h-72 items-center justify-center bg-[#f2e8d9] sm:h-[420px]">
                  <Sparkles size={54} className="text-[#a47d50]" />
                </div>
              )}

              <div className="p-6 sm:p-8">
                <span className="inline-flex rounded-full bg-[#f5eee5] px-3 py-1.5 text-xs font-semibold text-[#8f693f]">
                  {service.category}
                </span>

                <h2 className="mt-4 text-2xl font-semibold text-[#34232e] sm:text-3xl">
                  {service.serviceName}
                </h2>

                <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#81777a]">
                  {service.description}
                </p>

                <div className="mt-7 grid gap-4 border-t border-[#eee5dc] pt-6 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <span className="rounded-xl bg-[#f5eee5] p-3 text-[#9a7045]">
                      <Wallet size={20} />
                    </span>

                    <div>
                      <p className="text-xs text-[#a39799]">
                        Service price
                      </p>

                      <p className="mt-1 text-lg font-bold text-[#49313e]">
                        {formatPrice(service.price)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="rounded-xl bg-[#f5eee5] p-3 text-[#9a7045]">
                      <MapPin size={20} />
                    </span>

                    <div>
                      <p className="text-xs text-[#a39799]">
                        Service location
                      </p>

                      <p className="mt-1 text-sm font-semibold text-[#49313e]">
                        {service.location}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#eee5dc] bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-[#f5eee5] p-3 text-[#9a7045]">
                  <UserRound size={21} />
                </span>

                <div>
                  <h2 className="text-lg font-semibold text-[#34232e]">
                    Service provider
                  </h2>

                  <p className="text-xs text-[#a39799]">
                    Your wedding professional
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-[#faf8f5] p-5">
                <p className="font-semibold text-[#49313e]">
                  {service.vendor.businessName || service.vendor.name}
                </p>

                <p className="mt-1 text-sm text-[#81777a]">
                  {service.vendor.name}
                </p>

                <div className="mt-4 flex items-center gap-2 text-xs font-medium text-[#8f693f]">
                  <ShieldCheck size={16} />
                  WedPlan service provider
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-[#eee5dc] bg-white p-6 shadow-sm sm:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a47d50]">
                Booking request
              </p>

              <h2 className="mt-2 text-2xl font-semibold text-[#34232e]">
                Make it yours
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#81777a]">
                Send a booking request to the service provider with your
                event details.
              </p>

              {!user && (
                <div className="mt-6 rounded-2xl bg-[#faf8f5] p-5">
                  <p className="text-sm leading-6 text-[#6f6267]">
                    Sign in with a customer account to request this service.
                  </p>

                  <Link
                    href="/sign-in"
                    className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[#49313e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#604354]"
                  >
                    Sign in to book
                  </Link>

                  <Link
                    href="/sign-up"
                    className="mt-3 block text-center text-sm font-semibold text-[#9a7045] hover:underline"
                  >
                    Create a customer account
                  </Link>
                </div>
              )}

              {user && !isCustomer && (
                <div className="mt-6 rounded-2xl bg-[#faf8f5] p-5">
                  <p className="text-sm leading-6 text-[#6f6267]">
                    {isVendor
                      ? isOwnService
                        ? "You cannot book your own service."
                        : "Vendor accounts cannot submit customer booking requests."
                      : "Admin accounts cannot submit customer booking requests."}
                  </p>

                  <Link
                    href={
                      isVendor
                        ? "/vendor/dashboard"
                        : "/admin/dashboard"
                    }
                    className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-[#e9e1d9] px-5 py-3 text-sm font-semibold text-[#49313e] transition hover:bg-[#faf8f5]"
                  >
                    Go to dashboard
                  </Link>
                </div>
              )}

              {isCustomer && !isOwnService && (
                <form onSubmit={handleBooking} className="mt-6 space-y-5">
                  <div>
                    <label
                      htmlFor="event-date"
                      className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#49313e]"
                    >
                      <CalendarDays size={16} className="text-[#9a7045]" />
                      Event date
                    </label>

                    <input
                      id="event-date"
                      type="date"
                      required
                      min={getToday()}
                      value={eventDate}
                      onChange={(event) =>
                        setEventDate(event.target.value)
                      }
                      className="w-full rounded-xl border border-[#e9e1d9] bg-white px-4 py-3 text-sm text-[#49313e] outline-none transition focus:border-[#a47d50] focus:ring-2 focus:ring-[#a47d50]/10"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="event-location"
                      className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#49313e]"
                    >
                      <MapPin size={16} className="text-[#9a7045]" />
                      Event location
                    </label>

                    <input
                      id="event-location"
                      type="text"
                      required
                      minLength={3}
                      maxLength={200}
                      value={eventLocation}
                      onChange={(event) =>
                        setEventLocation(event.target.value)
                      }
                      placeholder="Enter your event location"
                      className="w-full rounded-xl border border-[#e9e1d9] bg-white px-4 py-3 text-sm text-[#49313e] outline-none transition placeholder:text-[#b0a6a5] focus:border-[#a47d50] focus:ring-2 focus:ring-[#a47d50]/10"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="booking-message"
                      className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#49313e]"
                    >
                      <MessageSquare size={16} className="text-[#9a7045]" />
                      Additional message
                    </label>

                    <textarea
                      id="booking-message"
                      rows={4}
                      maxLength={1000}
                      value={message}
                      onChange={(event) =>
                        setMessage(event.target.value)
                      }
                      placeholder="Share any requirements or details..."
                      className="w-full resize-y rounded-xl border border-[#e9e1d9] bg-white px-4 py-3 text-sm text-[#49313e] outline-none transition placeholder:text-[#b0a6a5] focus:border-[#a47d50] focus:ring-2 focus:ring-[#a47d50]/10"
                    />

                    <p className="mt-1 text-right text-xs text-[#a39799]">
                      {message.length}/1000
                    </p>
                  </div>

                  {bookingError && (
                    <div
                      role="alert"
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
                    >
                      {bookingError}
                    </div>
                  )}

                  {bookingSuccess && (
                    <div
                      role="status"
                      className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-6 text-green-800"
                    >
                      <div className="flex items-start gap-2">
                        <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                        <span>{bookingSuccess}</span>
                      </div>

                      <Link
                        href="/customer/dashboard"
                        className="mt-2 inline-block font-semibold underline"
                      >
                        Visit your dashboard
                      </Link>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      !eventDate ||
                      !eventLocation.trim()
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#49313e] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#604354] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <LoaderCircle
                          size={18}
                          className="animate-spin"
                        />
                        Sending request...
                      </>
                    ) : (
                      "Submit booking request"
                    )}
                  </button>

                  <p className="text-center text-xs leading-5 text-[#a39799]">
                    Your request will be sent to the vendor for review.
                    Submission does not guarantee confirmation.
                  </p>
                </form>
              )}
            </div>

            <div className="rounded-2xl border border-[#eee5dc] bg-[#f5eee5] p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  className="mt-0.5 shrink-0 text-[#9a7045]"
                  size={20}
                />

                <div>
                  <h3 className="text-sm font-semibold text-[#49313e]">
                    Book with confidence
                  </h3>

                  <p className="mt-1 text-xs leading-6 text-[#81777a]">
                    Your booking starts as a pending request. The vendor
                    must review it before it can be accepted.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function ServiceDetailsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#faf8f5]">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#e8ded1] border-t-[#9a7045]" />

            <p className="mt-4 text-sm text-[#81777a]">
              Loading service details...
            </p>
          </div>
        </main>
      }
    >
      <ServiceDetailsContent />
    </Suspense>
  );
}


"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";

interface Service {
  _id: string;
  vendorId: string;
  serviceName: string;
  category: string;
  description: string;
  price: number;
  location: string;
  images: string[];
  vendor: {
    _id: string;
    name: string;
    businessName?: string;
  };
}

interface ServicesResponse {
  success: boolean;
  data: Service[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  message?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const categories = [
  "Photography & Videography",
  "Wedding Venues",
  "Decoration & Florist",
  "Catering Services",
  "Makeup & Styling",
  "Wedding Fashion",
];

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(price);

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadServices = useCallback(async (signal: AbortSignal) => {
    if (!API_URL) {
      setError("The API URL is not configured.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const params = new URLSearchParams({
      page: String(page),
      limit: "12",
    });

    if (search.trim()) params.set("search", search.trim());
    if (category) params.set("category", category);
    if (location.trim()) params.set("location", location.trim());
    if (sort !== "newest") params.set("sort", sort);

    try {
      const response = await fetch(
        `${API_URL}/services?${params.toString()}`,
        {
          method: "GET",
          signal,
          cache: "no-store",
        }
      );

      const result = (await response.json()) as ServicesResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load services.");
      }

      setServices(result.data);
      setTotal(result.pagination.total);
      setTotalPages(result.pagination.totalPages);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading services."
      );
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [page, search, category, location, sort]);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      void loadServices(controller.signal);
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [loadServices]);

  const resetFilters = () => {
    setSearch("");
    setCategory("");
    setLocation("");
    setSort("newest");
    setPage(1);
  };

  const hasFilters = Boolean(search || category || location || sort !== "newest");

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

          <nav className="flex items-center gap-3 sm:gap-6">
            <Link
              href="/"
              className="hidden text-sm font-medium text-[#81777a] hover:text-[#49313e] sm:block"
            >
              Home
            </Link>
            <Link
              href="/sign-in"
              className="text-sm font-semibold text-[#49313e] hover:text-[#9a7045]"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-xl bg-[#49313e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#604354]"
            >
              Join WedPlan
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[#49313e] px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="absolute -right-24 -top-32 h-80 w-80 rounded-full border border-white/10" />
        <div className="absolute -right-8 -top-16 h-60 w-60 rounded-full border border-white/10" />

        <div className="relative mx-auto max-w-7xl">
          <Link
            href="/"
            className="mb-7 inline-flex items-center gap-2 text-sm text-white/65 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>

          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#e2c99d]">
            <Sparkles size={15} />
            Discover your perfect match
          </p>

          <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
            Find the services that make your day <span className="text-[#e2c99d]">beautiful.</span>
          </h1>

          <p className="mt-5 max-w-xl text-sm leading-7 text-white/70 sm:text-base">
            Explore wedding professionals, compare services and discover
            the right people for your celebration.
          </p>

          <div className="mt-8 flex flex-wrap gap-5 text-xs text-white/70">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#e2c99d]" />
              Approved providers
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#e2c99d]" />
              Easy booking requests
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#e2c99d]" />
              Compare your options
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a47d50]">
              The WedPlan marketplace
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[#34232e] sm:text-3xl">
              Explore wedding services
            </h2>
            <p className="mt-2 text-sm text-[#81777a]">
              Find trusted professionals for every part of your celebration.
            </p>
          </div>

          <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#8f693f] shadow-sm">
            {total} {total === 1 ? "service" : "services"} found
          </span>
        </div>

        <div className="rounded-2xl border border-[#eee5dc] bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <div>
              <label htmlFor="service-search" className="mb-2 block text-xs font-semibold text-[#6f6267]">
                Search services
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-[#e9e1d9] px-3">
                <Search size={18} className="shrink-0 text-[#a39799]" />
                <input
                  id="service-search"
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Name, vendor or keyword..."
                  className="min-w-0 w-full bg-transparent py-3 text-sm outline-none placeholder:text-[#b0a6a5]"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                    aria-label="Clear search"
                    className="text-[#a39799] hover:text-[#49313e]"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="category-filter" className="mb-2 block text-xs font-semibold text-[#6f6267]">
                Category
              </label>
              <div className="relative">
                <select
                  id="category-filter"
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value);
                    setPage(1);
                  }}
                  className="w-full appearance-none rounded-xl border border-[#e9e1d9] bg-white px-3 py-3 pr-9 text-sm text-[#49313e] outline-none focus:border-[#ad8454]"
                >
                  <option value="">All categories</option>
                  {categories.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#a39799]" />
              </div>
            </div>

            <div>
              <label htmlFor="location-filter" className="mb-2 block text-xs font-semibold text-[#6f6267]">
                Location
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-[#e9e1d9] px-3">
                <MapPin size={17} className="shrink-0 text-[#a39799]" />
                <input
                  id="location-filter"
                  type="text"
                  value={location}
                  onChange={(event) => {
                    setLocation(event.target.value);
                    setPage(1);
                  }}
                  placeholder="e.g. Dhaka"
                  className="w-full min-w-0 bg-transparent py-3 text-sm outline-none placeholder:text-[#b0a6a5]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="sort-services" className="mb-2 block text-xs font-semibold text-[#6f6267]">
                Sort services
              </label>
              <div className="relative">
                <select
                  id="sort-services"
                  value={sort}
                  onChange={(event) => {
                    setSort(event.target.value);
                    setPage(1);
                  }}
                  className="w-full appearance-none rounded-xl border border-[#e9e1d9] bg-white px-3 py-3 pr-9 text-sm text-[#49313e] outline-none focus:border-[#ad8454]"
                >
                  <option value="newest">Recently updated</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#a39799]" />
              </div>
            </div>
          </div>

          {hasFilters && (
            <div className="mt-4 flex justify-end border-t border-[#f0e9e2] pt-4">
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#9a7045] hover:text-[#49313e]"
              >
                <X size={14} />
                Clear all filters
              </button>
            </div>
          )}
        </div>

        <div className="mb-5 mt-9 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-[#81777a]">
            <SlidersHorizontal size={17} />
            {loading ? "Finding services..." : `Showing ${services.length} on this page`}
          </div>
          <span className="text-xs text-[#a39799]">
            Page {page} of {Math.max(totalPages, 1)}
          </span>
        </div>

        {error && (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            <p className="font-semibold">Unable to load services</p>
            <p className="mt-1">{error}</p>
            <button
              type="button"
              onClick={() => {
                const controller = new AbortController();
                void loadServices(controller.signal);
              }}
              className="mt-3 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {loading && (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-2xl border border-[#eee5dc] bg-white">
                <div className="h-56 animate-pulse bg-[#eee8e1]" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-[#eee8e1]" />
                  <div className="h-3 w-full animate-pulse rounded bg-[#f3eee8]" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-[#f3eee8]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && services.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <article
                key={service._id}
                className="group overflow-hidden rounded-2xl border border-[#eee5dc] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[#49313e]/5"
              >
                <div className="relative h-56 overflow-hidden bg-[#f1e9df]">
                  {service.images?.[0] ? (
                    <img
                      src={service.images[0]}
                      alt={service.serviceName}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[#b29a7d]">
                      <BriefcaseBusiness size={48} strokeWidth={1.2} />
                    </div>
                  )}

                  <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-[#8f693f] shadow-sm">
                    {service.category}
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold leading-snug text-[#49313e]">
                      {service.serviceName}
                    </h3>
                    <span className="shrink-0 text-sm font-bold text-[#9a7045]">
                      {formatPrice(service.price)}
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-[#81777a]">
                    {service.description}
                  </p>

                  <div className="mt-4 space-y-2 border-t border-[#f0e9e2] pt-4">
                    <p className="flex items-center gap-2 text-xs text-[#81777a]">
                      <MapPin size={15} className="text-[#a47d50]" />
                      {service.location}
                    </p>
                    <p className="flex items-center gap-2 text-xs text-[#81777a]">
                      <BriefcaseBusiness size={15} className="text-[#a47d50]" />
                      {service.vendor?.businessName || service.vendor?.name || "Wedding professional"}
                    </p>
                  </div>

                  <Link
                    href={`/services/${service._id}`}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#49313e] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#604354]"
                  >
                    View service details
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && !error && services.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#e6ded8] bg-white px-5 py-16 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f2e8d9] text-[#9a7045]">
              <Search size={24} />
            </span>
            <h3 className="mt-5 text-lg font-semibold text-[#49313e]">
              No services found
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#81777a]">
              We couldn't find services matching your filters. Try changing
              your search or explore another category.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-5 rounded-xl bg-[#49313e] px-5 py-3 text-sm font-semibold text-white hover:bg-[#604354]"
            >
              Clear filters
            </button>
          </div>
        )}

        {!loading && !error && totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => {
                setPage((current) => Math.max(1, current - 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-[#e6ded8] bg-white px-4 py-3 text-sm font-semibold text-[#49313e] transition hover:bg-[#f8f3ed] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft size={16} />
              Previous
            </button>

            <span className="text-sm font-medium text-[#81777a]">
              {page} / {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => {
                setPage((current) => Math.min(totalPages, current + 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-[#e6ded8] bg-white px-4 py-3 text-sm font-semibold text-[#49313e] transition hover:bg-[#f8f3ed] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </section>

      <footer className="mt-12 border-t border-[#eee5dc] bg-white px-5 py-7 text-center text-xs text-[#a39799]">
        WedPlan · Your day, your way.
      </footer>
    </main>
  );
}

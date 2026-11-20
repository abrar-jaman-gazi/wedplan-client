
"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Eye,
  LoaderCircle,
  Lock,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Unlock,
  X,
} from "lucide-react";

type ApprovalStatus = "pending" | "approved" | "rejected";
type AvailabilityStatus = "active" | "inactive";

interface AdminService {
  _id: string;
  vendorId: string;
  serviceName: string;
  category: string;
  description: string;
  price: number;
  location: string;
  images: string[];
  status: AvailabilityStatus;
  approvalStatus: ApprovalStatus;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ServicesResponse {
  success: boolean;
  data: AdminService[];
  pagination: Pagination;
  message?: string;
}

type FilterStatus = "all" | ApprovalStatus;
type FilterAvailability = "all" | AvailabilityStatus;

type ServiceAction =
  | "approve"
  | "reject"
  | "activate"
  | "deactivate"
  | "delete";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const categories = [
  "Photography & Videography",
  "Wedding Venues",
  "Decoration & Florist",
  "Catering Services",
  "Makeup & Styling",
  "Wedding Fashion",
];

const getAuthToken = async (): Promise<string> => {
  if (!API_URL) {
    throw new Error("The API URL is not configured.");
  }

  const response = await fetch(`${API_URL}/auth/token`, {
    credentials: "include",
  });

  const result = (await response.json()) as {
    token?: string;
    message?: string;
  };

  if (!response.ok || !result.token) {
    throw new Error(
      result.message || "Unable to authenticate your request."
    );
  }

  return result.token;
};

const getErrorMessage = async (
  response: Response
): Promise<string> => {
  try {
    const result = (await response.json()) as {
      message?: string;
    };

    return result.message || "Something went wrong.";
  } catch {
    return "Something went wrong. Please try again.";
  }
};

const formatDate = (value: string | null): string => {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(price);
};

export default function ServicesManagement() {
  const [services, setServices] = useState<AdminService[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [approvalStatus, setApprovalStatus] =
    useState<FilterStatus>("all");
  const [availability, setAvailability] =
    useState<FilterAvailability>("all");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedService, setSelectedService] =
    useState<AdminService | null>(null);

  const [actionService, setActionService] =
    useState<AdminService | null>(null);
  const [action, setAction] = useState<ServiceAction | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionError, setActionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();

    const loadServices = async () => {
      setIsLoading(true);
      setError("");

      try {
        const token = await getAuthToken();

        const params = new URLSearchParams({
          page: String(pagination.page),
          limit: String(pagination.limit),
        });

        if (search) params.set("search", search);
        if (category !== "all") params.set("category", category);
        if (approvalStatus !== "all") {
          params.set("approvalStatus", approvalStatus);
        }
        if (availability !== "all") {
          params.set("status", availability);
        }

        const response = await fetch(
          `${API_URL}/admin/services?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(await getErrorMessage(response));
        }

        const result =
          (await response.json()) as ServicesResponse;

        if (!result.success) {
          throw new Error(
            result.message || "Unable to retrieve services."
          );
        }

        setServices(result.data);
        setPagination(result.pagination);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load services."
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadServices();

    return () => controller.abort();
  }, [
    pagination.page,
    pagination.limit,
    search,
    category,
    approvalStatus,
    availability,
    refreshKey,
  ]);

  const resetPage = () => {
    setPagination((current) => ({
      ...current,
      page: 1,
    }));
  };

  const updateFilter = (callback: () => void) => {
    callback();
    resetPage();
  };

  const openAction = (
    service: AdminService,
    nextAction: ServiceAction
  ) => {
    setActionService(service);
    setAction(nextAction);
    setActionError("");
    setRejectionReason("");
  };

  const closeAction = () => {
    if (isSubmitting) return;

    setActionService(null);
    setAction(null);
    setActionError("");
    setRejectionReason("");
  };

  const handleAction = async () => {
    if (!actionService || !action) return;

    if (
      action === "reject" &&
      (rejectionReason.trim().length < 5 ||
        rejectionReason.trim().length > 500)
    ) {
      setActionError(
        "Rejection reason must contain between 5 and 500 characters."
      );
      return;
    }

    setIsSubmitting(true);
    setActionError("");

    try {
      const token = await getAuthToken();

      const endpointMap: Record<ServiceAction, string> = {
        approve: "approve",
        reject: "reject",
        activate: "status",
        deactivate: "status",
        delete: "",
      };

      const methodMap: Record<ServiceAction, string> = {
        approve: "PATCH",
        reject: "PATCH",
        activate: "PATCH",
        deactivate: "PATCH",
        delete: "DELETE",
      };

      const endpoint = endpointMap[action];
      const url = `${API_URL}/admin/services/${actionService._id}${
        endpoint ? `/${endpoint}` : ""
      }`;

      let body: string | undefined;

      if (action === "reject") {
        body = JSON.stringify({
          rejectionReason: rejectionReason.trim(),
        });
      }

      if (action === "activate" || action === "deactivate") {
        body = JSON.stringify({
          status: action === "activate" ? "active" : "inactive",
        });
      }

      const response = await fetch(url, {
        method: methodMap[action],
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        ...(body ? { body } : {}),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      setActionService(null);
      setAction(null);
      setRejectionReason("");
      setSelectedService((current) =>
        current?._id === actionService._id ? null : current
      );
      setRefreshKey((current) => current + 1);
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Unable to complete the requested action."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingCount = services.filter(
    (service) => service.approvalStatus === "pending"
  ).length;

  const approvedCount = services.filter(
    (service) => service.approvalStatus === "approved"
  ).length;

  const rejectedCount = services.filter(
    (service) => service.approvalStatus === "rejected"
  ).length;

  const actionTitle: Record<ServiceAction, string> = {
    approve: "Approve this service?",
    reject: "Reject this service?",
    activate: "Activate this service?",
    deactivate: "Deactivate this service?",
    delete: "Delete this service permanently?",
  };

  const actionDescription: Record<ServiceAction, string> = {
    approve:
      "This service will be approved and activated if the vendor meets the subscription service limit.",
    reject:
      "This service will be rejected and remain unavailable to customers.",
    activate:
      "This approved service will become active and visible to customers.",
    deactivate:
      "This service will become inactive and unavailable to customers.",
    delete:
      "This action permanently removes the service. This cannot be undone.",
  };

  const actionButtonText: Record<ServiceAction, string> = {
    approve: "Confirm approval",
    reject: "Confirm rejection",
    activate: "Activate service",
    deactivate: "Deactivate service",
    delete: "Delete permanently",
  };

  return (
    <section className="space-y-7">
      <div className="rounded-3xl bg-[#49313e] px-6 py-9 text-white sm:px-9">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-[#e2c99d]">
            <BriefcaseBusiness size={25} />
          </span>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e2c99d]">
              Service moderation
            </p>

            <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">
              Manage wedding services
            </h2>
          </div>
        </div>

        <p className="mt-5 max-w-2xl text-sm leading-7 text-white/75">
          Review vendor submissions, approve or reject services,
          and manage the availability of published listings.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total services"
          value={pagination.total}
        />
        <StatCard label="Pending on this page" value={pendingCount} />
        <StatCard label="Approved on this page" value={approvedCount} />
        <StatCard label="Rejected on this page" value={rejectedCount} />
      </div>

      <div className="rounded-2xl border border-[#eee5dc] bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[#34232e]">
              Submitted services
            </h3>
            <p className="mt-1 text-xs text-[#a39799]">
              Search, filter, review, and moderate service submissions.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setRefreshKey((current) => current + 1)}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#eee5dc] px-4 py-2.5 text-sm font-semibold text-[#49313e] transition hover:bg-[#faf8f5] disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={isLoading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a39799]"
            />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                resetPage();
              }}
              placeholder="Search service name or description..."
              className="w-full rounded-xl border border-[#eee5dc] bg-[#fcfaf7] py-3 pl-11 pr-4 text-sm text-[#49313e] outline-none placeholder:text-[#b0a39e] focus:border-[#ad8454]"
            />
          </div>

          <select
            value={category}
            onChange={(event) =>
              updateFilter(() => setCategory(event.target.value))
            }
            className="rounded-xl border border-[#eee5dc] bg-[#fcfaf7] px-4 py-3 text-sm text-[#49313e] outline-none focus:border-[#ad8454]"
          >
            <option value="all">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={approvalStatus}
            onChange={(event) =>
              updateFilter(() =>
                setApprovalStatus(event.target.value as FilterStatus)
              )
            }
            className="rounded-xl border border-[#eee5dc] bg-[#fcfaf7] px-4 py-3 text-sm text-[#49313e] outline-none focus:border-[#ad8454]"
          >
            <option value="all">All approval statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={availability}
            onChange={(event) =>
              updateFilter(() =>
                setAvailability(
                  event.target.value as FilterAvailability
                )
              )
            }
            className="rounded-xl border border-[#eee5dc] bg-[#fcfaf7] px-4 py-3 text-sm text-[#49313e] outline-none focus:border-[#ad8454]"
          >
            <option value="all">All availability</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Unable to load services</p>
              <p className="mt-1">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => setRefreshKey((current) => current + 1)}
              className="font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#a39799]">
          <p>{pagination.total} services found</p>
          <p>
            Approval and availability are managed separately.
          </p>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[950px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#eee5dc] text-[11px] font-bold uppercase tracking-wider text-[#a39799]">
                <th className="px-4 py-4">Service</th>
                <th className="px-4 py-4">Category</th>
                <th className="px-4 py-4">Price</th>
                <th className="px-4 py-4">Approval</th>
                <th className="px-4 py-4">Availability</th>
                <th className="px-4 py-4">Submitted</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <LoaderCircle
                      size={27}
                      className="mx-auto animate-spin text-[#9a7045]"
                    />
                    <p className="mt-3 text-sm text-[#81777a]">
                      Loading submitted services...
                    </p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-[#81777a]"
                  >
                    Service records could not be displayed.
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <BriefcaseBusiness
                      size={30}
                      className="mx-auto text-[#c5b8ae]"
                    />
                    <p className="mt-3 text-sm font-semibold text-[#49313e]">
                      No services found
                    </p>
                    <p className="mt-1 text-xs text-[#a39799]">
                      Try changing your search or filters.
                    </p>
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr
                    key={service._id}
                    className="border-b border-[#f2ece6] transition hover:bg-[#fcfaf7]"
                  >
                    <td className="px-4 py-4">
                      <p className="max-w-[210px] truncate text-sm font-semibold text-[#49313e]">
                        {service.serviceName}
                      </p>
                      <p className="mt-1 text-xs text-[#a39799]">
                        {service.location}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-xs text-[#81777a]">
                      {service.category}
                    </td>

                    <td className="px-4 py-4 text-sm font-semibold text-[#49313e]">
                      {formatPrice(service.price)}
                    </td>

                    <td className="px-4 py-4">
                      <ApprovalBadge status={service.approvalStatus} />
                    </td>

                    <td className="px-4 py-4">
                      <AvailabilityBadge status={service.status} />
                    </td>

                    <td className="px-4 py-4 text-xs text-[#81777a]">
                      {formatDate(service.createdAt)}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          title="View service details"
                          aria-label={`View ${service.serviceName}`}
                          onClick={() => setSelectedService(service)}
                          className="rounded-lg border border-[#eee5dc] p-2 text-[#8f693f] transition hover:bg-[#f8f3ed]"
                        >
                          <Eye size={16} />
                        </button>

                        {service.approvalStatus === "pending" && (
                          <>
                            <button
                              type="button"
                              title="Approve service"
                              onClick={() => openAction(service, "approve")}
                              className="rounded-lg border border-green-100 p-2 text-green-700 transition hover:bg-green-50"
                            >
                              <ShieldCheck size={16} />
                            </button>

                            <button
                              type="button"
                              title="Reject service"
                              onClick={() => openAction(service, "reject")}
                              className="rounded-lg border border-red-100 p-2 text-red-600 transition hover:bg-red-50"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}

                        {service.approvalStatus === "approved" && (
                          <button
                            type="button"
                            title={
                              service.status === "active"
                                ? "Deactivate service"
                                : "Activate service"
                            }
                            onClick={() =>
                              openAction(
                                service,
                                service.status === "active"
                                  ? "deactivate"
                                  : "activate"
                              )
                            }
                            className="rounded-lg border border-[#eee5dc] p-2 text-[#8f693f] transition hover:bg-[#f8f3ed]"
                          >
                            {service.status === "active" ? (
                              <Lock size={16} />
                            ) : (
                              <Unlock size={16} />
                            )}
                          </button>
                        )}

                        <button
                          type="button"
                          title="Delete service"
                          onClick={() => openAction(service, "delete")}
                          className="rounded-lg border border-red-100 p-2 text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-col items-center justify-between gap-4 border-t border-[#eee5dc] pt-5 sm:flex-row">
          <p className="text-xs text-[#a39799]">
            Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
            {" · "}
            {pagination.total} total services
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isLoading || pagination.page <= 1}
              onClick={() =>
                setPagination((current) => ({
                  ...current,
                  page: current.page - 1,
                }))
              }
              className="inline-flex items-center gap-1 rounded-lg border border-[#eee5dc] px-3 py-2 text-xs font-semibold text-[#49313e] hover:bg-[#faf8f5] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={15} />
              Previous
            </button>

            <button
              type="button"
              disabled={
                isLoading ||
                pagination.page >= pagination.totalPages
              }
              onClick={() =>
                setPagination((current) => ({
                  ...current,
                  page: current.page + 1,
                }))
              }
              className="inline-flex items-center gap-1 rounded-lg border border-[#eee5dc] px-3 py-2 text-xs font-semibold text-[#49313e] hover:bg-[#faf8f5] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {selectedService && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#241923]/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedService(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-details-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a47d50]">
                  Service information
                </p>
                <h3
                  id="service-details-title"
                  className="mt-2 text-xl font-semibold text-[#49313e]"
                >
                  {selectedService.serviceName}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedService(null)}
                aria-label="Close service details"
                className="rounded-lg p-2 text-[#81777a] hover:bg-[#faf8f5]"
              >
                <X size={20} />
              </button>
            </div>

            {selectedService.images.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {selectedService.images.map((image, index) => (
                  <a
                    key={`${image}-${index}`}
                    href={image}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-[#eee5dc] px-3 py-2 text-xs font-semibold text-[#8f693f] hover:bg-[#f8f3ed]"
                  >
                    Open service image {index + 1}
                  </a>
                ))}
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              <ApprovalBadge status={selectedService.approvalStatus} />
              <AvailabilityBadge status={selectedService.status} />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <DetailItem
                label="Category"
                value={selectedService.category}
              />
              <DetailItem
                label="Price"
                value={formatPrice(selectedService.price)}
              />
              <DetailItem
                label="Location"
                value={selectedService.location}
              />
              <DetailItem
                label="Vendor ID"
                value={selectedService.vendorId}
              />
              <DetailItem
                label="Submitted"
                value={formatDate(selectedService.createdAt)}
              />
              <DetailItem
                label="Last updated"
                value={formatDate(selectedService.updatedAt)}
              />
              <DetailItem
                label="Approved date"
                value={formatDate(selectedService.approvedAt)}
              />
              <DetailItem
                label="Rejected date"
                value={formatDate(selectedService.rejectedAt)}
              />
            </div>

            <div className="mt-6 rounded-xl bg-[#faf8f5] p-4">
              <p className="text-xs font-semibold text-[#8f693f]">
                Description
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#49313e]">
                {selectedService.description}
              </p>
            </div>

            {selectedService.rejectionReason && (
              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4">
                <p className="text-xs font-semibold text-red-700">
                  Rejection reason
                </p>
                <p className="mt-2 text-sm leading-6 text-red-700">
                  {selectedService.rejectionReason}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setSelectedService(null)}
              className="mt-7 w-full rounded-xl bg-[#49313e] px-5 py-3 text-sm font-semibold text-white hover:bg-[#604454]"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {actionService && action && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#241923]/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-action-title"
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f8f3ed] text-[#9a7045]">
              {action === "delete" ? (
                <Trash2 size={23} />
              ) : action === "approve" ? (
                <ShieldCheck size={23} />
              ) : action === "reject" ? (
                <X size={23} />
              ) : action === "activate" ? (
                <Unlock size={23} />
              ) : (
                <Lock size={23} />
              )}
            </div>

            <h3
              id="service-action-title"
              className="mt-5 text-xl font-semibold text-[#49313e]"
            >
              {actionTitle[action]}
            </h3>

            <p className="mt-3 text-sm leading-6 text-[#81777a]">
              {actionDescription[action]}
            </p>

            <p className="mt-3 rounded-lg bg-[#faf8f5] p-3 text-sm font-semibold text-[#49313e]">
              {actionService.serviceName}
            </p>

            {action === "reject" && (
              <div className="mt-5">
                <label
                  htmlFor="rejection-reason"
                  className="mb-2 block text-xs font-semibold text-[#49313e]"
                >
                  Rejection reason
                </label>

                <textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(event) =>
                    setRejectionReason(event.target.value)
                  }
                  rows={4}
                  maxLength={500}
                  placeholder="Explain why this service is being rejected..."
                  className="w-full resize-y rounded-xl border border-[#eee5dc] bg-[#fcfaf7] p-3 text-sm text-[#49313e] outline-none placeholder:text-[#b0a39e] focus:border-[#ad8454]"
                />

                <p className="mt-1 text-right text-[11px] text-[#a39799]">
                  {rejectionReason.length}/500 characters
                </p>
              </div>
            )}

            {actionError && (
              <p
                role="alert"
                className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-700"
              >
                {actionError}
              </p>
            )}

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={closeAction}
                className="rounded-xl border border-[#eee5dc] px-5 py-3 text-sm font-semibold text-[#49313e] hover:bg-[#faf8f5] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => void handleAction()}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:opacity-50 ${
                  action === "delete" || action === "reject"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-[#49313e] hover:bg-[#604454]"
                }`}
              >
                {isSubmitting ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : null}
                {isSubmitting ? "Processing..." : actionButtonText[action]}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-[#eee5dc] bg-white p-5">
      <p className="text-xs font-medium text-[#81777a]">{label}</p>
      <p className="mt-4 text-2xl font-bold text-[#49313e]">{value}</p>
    </div>
  );
}

function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  const styles: Record<ApprovalStatus, string> = {
    pending: "bg-amber-50 text-amber-700",
    approved: "bg-green-50 text-green-700",
    rejected: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function AvailabilityBadge({
  status,
}: {
  status: AvailabilityStatus;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${
        status === "active"
          ? "bg-green-50 text-green-700"
          : "bg-gray-100 text-gray-600"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "active" ? "bg-green-500" : "bg-gray-400"
        }`}
      />
      {status}
    </span>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium text-[#a39799]">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-[#49313e]">
        {value}
      </p>
    </div>
  );
}

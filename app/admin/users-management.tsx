
"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Building2,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  LoaderCircle,
  Lock,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  Unlock,
  UserRound,
  Users,
  X,
} from "lucide-react";

type UserRole = "customer" | "vendor";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  role: UserRole;
  isBlocked: boolean;
  businessName?: string;
  subscriptionPlan: string;
  subscriptionExpiresAt: string | null;
  image?: string;
}

interface Pagination {
  currentPage: number;
  limit: number;
  totalUsers: number;
  totalPages: number;
}

interface UsersResponse {
  success: boolean;
  message: string;
  data: {
    users: AdminUser[];
    pagination: Pagination;
  };
}

interface UserDetailsResponse {
  success: boolean;
  message: string;
  data: AdminUser | { user: AdminUser };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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

const formatDate = (date: string): string => {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
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

export default function UsersManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    limit: 10,
    totalUsers: 0,
    totalPages: 0,
  });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<"all" | UserRole>("all");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedUser, setSelectedUser] =
    useState<AdminUser | null>(null);

  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  const [actionUser, setActionUser] =
    useState<AdminUser | null>(null);

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();

    const loadUsers = async () => {
      setIsLoading(true);
      setError("");

      try {
        const token = await getAuthToken();

        const params = new URLSearchParams({
          page: String(pagination.currentPage),
          limit: String(pagination.limit),
        });

        if (search) {
          params.set("search", search);
        }

        if (role !== "all") {
          params.set("role", role);
        }

        const response = await fetch(
          `${API_URL}/admin/users?${params.toString()}`,
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

        const result = (await response.json()) as UsersResponse;

        if (!result.success) {
          throw new Error(
            result.message || "Unable to retrieve users."
          );
        }

        setUsers(result.data.users);
        setPagination(result.data.pagination);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load users."
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadUsers();

    return () => controller.abort();
  }, [
    pagination.currentPage,
    pagination.limit,
    search,
    role,
    refreshKey,
  ]);

  const handleRoleChange = (
    nextRole: "all" | UserRole
  ) => {
    setRole(nextRole);
    setPagination((current) => ({
      ...current,
      currentPage: 1,
    }));
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setPagination((current) => ({
      ...current,
      currentPage: 1,
    }));
  };

  const handleViewDetails = async (user: AdminUser) => {
    setSelectedUser(user);
    setDetailsLoading(true);
    setDetailsError("");

    try {
      const token = await getAuthToken();

      const response = await fetch(
        `${API_URL}/admin/users/${user._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const result =
        (await response.json()) as UserDetailsResponse;

      if (!result.success) {
        throw new Error(
          result.message || "Unable to retrieve user details."
        );
      }

      const details =
        "user" in result.data ? result.data.user : result.data;

      setSelectedUser(details);
    } catch (err) {
      setDetailsError(
        err instanceof Error
          ? err.message
          : "Unable to load user details."
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!actionUser) {
      return;
    }

    setIsUpdatingStatus(true);
    setActionError("");

    try {
      const token = await getAuthToken();

      const endpoint = actionUser.isBlocked
        ? "unblock"
        : "block";

      const response = await fetch(
        `${API_URL}/admin/users/${actionUser._id}/${endpoint}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      setActionUser(null);

      setSelectedUser((current) =>
        current && current._id === actionUser._id
          ? {
              ...current,
              isBlocked: !current.isBlocked,
            }
          : current
      );

      setRefreshKey((current) => current + 1);
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Unable to update account status."
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const vendorCount = users.filter(
    (user) => user.role === "vendor"
  ).length;

  const customerCount = users.filter(
    (user) => user.role === "customer"
  ).length;

  return (
    <section className="space-y-7">
      <div className="rounded-3xl bg-[#49313e] px-6 py-9 text-white sm:px-9">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-[#e2c99d]">
            <Users size={25} />
          </span>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e2c99d]">
              Account administration
            </p>

            <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">
              Manage users
            </h2>
          </div>
        </div>

        <p className="mt-5 max-w-2xl text-sm leading-7 text-white/75">
          View registered customers and vendors, inspect account
          details, and manage account access from one place.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total users"
          value={pagination.totalUsers}
          icon={<Users size={21} />}
        />

        <StatCard
          label="Vendors on this page"
          value={vendorCount}
          icon={<Building2 size={21} />}
        />

        <StatCard
          label="Customers on this page"
          value={customerCount}
          icon={<UserRound size={21} />}
        />
      </div>

      <div className="rounded-2xl border border-[#eee5dc] bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[#34232e]">
              Registered accounts
            </h3>

            <p className="mt-1 text-xs text-[#a39799]">
              Search and manage customer and vendor accounts.
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

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a39799]"
            />

            <input
              type="search"
              value={searchInput}
              onChange={(event) =>
                handleSearchChange(event.target.value)
              }
              placeholder="Search by name or email..."
              className="w-full rounded-xl border border-[#eee5dc] bg-[#fcfaf7] py-3 pl-11 pr-4 text-sm text-[#49313e] outline-none transition placeholder:text-[#b0a39e] focus:border-[#ad8454] focus:ring-2 focus:ring-[#ad8454]/10"
            />
          </div>

          <select
            value={role}
            onChange={(event) =>
              handleRoleChange(
                event.target.value as "all" | UserRole
              )
            }
            className="rounded-xl border border-[#eee5dc] bg-[#fcfaf7] px-4 py-3 text-sm text-[#49313e] outline-none focus:border-[#ad8454]"
          >
            <option value="all">All users</option>
            <option value="customer">Customers</option>
            <option value="vendor">Vendors</option>
          </select>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#a39799]">
          <p>
            {pagination.totalUsers} account
            {pagination.totalUsers === 1 ? "" : "s"} found
          </p>

          <p>
            Admin accounts are excluded from this management list.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={19} className="mt-0.5 shrink-0" />

            <div className="flex-1">
              <p className="font-semibold">Unable to load users</p>
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

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#eee5dc] text-[11px] font-bold uppercase tracking-wider text-[#a39799]">
                <th className="px-4 py-4">User</th>
                <th className="px-4 py-4">Role</th>
                <th className="px-4 py-4">Business</th>
                <th className="px-4 py-4">Plan</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Registered</th>
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
                      Loading registered users...
                    </p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-[#81777a]"
                  >
                    User records could not be displayed.
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <Users
                      size={30}
                      className="mx-auto text-[#c5b8ae]"
                    />

                    <p className="mt-3 text-sm font-semibold text-[#49313e]">
                      No users found
                    </p>

                    <p className="mt-1 text-xs text-[#a39799]">
                      Try changing your search or role filter.
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user._id}
                    className="border-b border-[#f2ece6] transition hover:bg-[#fcfaf7]"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f0e4d5] text-sm font-bold uppercase text-[#8f693f]">
                          {user.name?.trim().charAt(0) || "U"}
                        </div>

                        <div className="min-w-0">
                          <p className="max-w-[180px] truncate text-sm font-semibold text-[#49313e]">
                            {user.name}
                          </p>

                          <p className="max-w-[190px] truncate text-xs text-[#a39799]">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <RoleBadge role={user.role} />
                    </td>

                    <td className="px-4 py-4 text-sm text-[#81777a]">
                      {user.role === "vendor"
                        ? user.businessName || "Not provided"
                        : "—"}
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-full bg-[#f8f3ed] px-3 py-1.5 text-xs font-semibold capitalize text-[#8f693f]">
                        {user.subscriptionPlan || "free"}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge isBlocked={user.isBlocked} />
                    </td>

                    <td className="px-4 py-4 text-xs text-[#81777a]">
                      {formatDate(user.createdAt)}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          title="View user details"
                          aria-label={`View ${user.name} details`}
                          onClick={() => void handleViewDetails(user)}
                          className="rounded-lg border border-[#eee5dc] p-2 text-[#8f693f] transition hover:bg-[#f8f3ed]"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          type="button"
                          title={
                            user.isBlocked
                              ? "Unblock user"
                              : "Block user"
                          }
                          aria-label={
                            user.isBlocked
                              ? `Unblock ${user.name}`
                              : `Block ${user.name}`
                          }
                          onClick={() => {
                            setActionError("");
                            setActionUser(user);
                          }}
                          className={`rounded-lg border p-2 transition ${
                            user.isBlocked
                              ? "border-green-100 text-green-700 hover:bg-green-50"
                              : "border-red-100 text-red-600 hover:bg-red-50"
                          }`}
                        >
                          {user.isBlocked ? (
                            <Unlock size={16} />
                          ) : (
                            <Lock size={16} />
                          )}
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
            Page {pagination.currentPage} of{" "}
            {Math.max(pagination.totalPages, 1)}
            {" · "}
            {pagination.totalUsers} total users
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={
                isLoading || pagination.currentPage <= 1
              }
              onClick={() =>
                setPagination((current) => ({
                  ...current,
                  currentPage: current.currentPage - 1,
                }))
              }
              className="inline-flex items-center gap-1 rounded-lg border border-[#eee5dc] px-3 py-2 text-xs font-semibold text-[#49313e] transition hover:bg-[#faf8f5] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={15} />
              Previous
            </button>

            <button
              type="button"
              disabled={
                isLoading ||
                pagination.currentPage >= pagination.totalPages
              }
              onClick={() =>
                setPagination((current) => ({
                  ...current,
                  currentPage: current.currentPage + 1,
                }))
              }
              className="inline-flex items-center gap-1 rounded-lg border border-[#eee5dc] px-3 py-2 text-xs font-semibold text-[#49313e] transition hover:bg-[#faf8f5] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {selectedUser && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#241923]/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedUser(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-details-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a47d50]">
                  Account information
                </p>

                <h3
                  id="user-details-title"
                  className="mt-2 text-xl font-semibold text-[#49313e]"
                >
                  User details
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                aria-label="Close user details"
                className="rounded-lg p-2 text-[#81777a] hover:bg-[#faf8f5]"
              >
                <X size={20} />
              </button>
            </div>

            {detailsLoading ? (
              <div className="py-14 text-center">
                <LoaderCircle
                  size={28}
                  className="mx-auto animate-spin text-[#9a7045]"
                />

                <p className="mt-3 text-sm text-[#81777a]">
                  Loading account details...
                </p>
              </div>
            ) : detailsError ? (
              <div
                role="alert"
                className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700"
              >
                {detailsError}
              </div>
            ) : (
              <>
                <div className="mt-6 flex items-center gap-4 rounded-xl bg-[#faf8f5] p-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f0e4d5] text-xl font-bold uppercase text-[#8f693f]">
                    {selectedUser.name?.trim().charAt(0) || "U"}
                  </div>

                  <div className="min-w-0">
                    <h4 className="truncate text-base font-bold text-[#49313e]">
                      {selectedUser.name}
                    </h4>

                    <p className="mt-1 truncate text-xs text-[#81777a]">
                      {selectedUser.email}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <RoleBadge role={selectedUser.role} />
                      <StatusBadge
                        isBlocked={selectedUser.isBlocked}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <DetailRow
                    icon={<Mail size={17} />}
                    label="Email address"
                    value={selectedUser.email}
                  />

                  <DetailRow
                    icon={<UserRound size={17} />}
                    label="Account role"
                    value={selectedUser.role}
                  />

                  <DetailRow
                    icon={<Building2 size={17} />}
                    label="Business name"
                    value={
                      selectedUser.role === "vendor"
                        ? selectedUser.businessName || "Not provided"
                        : "Not applicable"
                    }
                  />

                  <DetailRow
                    icon={<ShieldCheck size={17} />}
                    label="Subscription plan"
                    value={selectedUser.subscriptionPlan || "free"}
                  />

                  <DetailRow
                    icon={<CalendarDays size={17} />}
                    label="Registered on"
                    value={formatDate(selectedUser.createdAt)}
                  />

                  <DetailRow
                    icon={<CalendarDays size={17} />}
                    label="Subscription expires"
                    value={
                      selectedUser.subscriptionExpiresAt
                        ? formatDate(
                            selectedUser.subscriptionExpiresAt
                          )
                        : "No expiry date"
                    }
                  />
                </div>
              </>
            )}

            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="mt-7 w-full rounded-xl bg-[#49313e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#604454]"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {actionUser && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#241923]/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="status-confirmation-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f8f3ed] text-[#9a7045]">
              {actionUser.isBlocked ? (
                <Unlock size={23} />
              ) : (
                <Lock size={23} />
              )}
            </div>

            <h3
              id="status-confirmation-title"
              className="mt-5 text-xl font-semibold text-[#49313e]"
            >
              {actionUser.isBlocked
                ? "Unblock this account?"
                : "Block this account?"}
            </h3>

            <p className="mt-3 text-sm leading-6 text-[#81777a]">
              {actionUser.isBlocked
                ? `Are you sure you want to restore access for ${actionUser.name}?`
                : `Are you sure you want to block ${actionUser.name}? This account will no longer be able to access protected platform features.`}
            </p>

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
                disabled={isUpdatingStatus}
                onClick={() => {
                  setActionUser(null);
                  setActionError("");
                }}
                className="rounded-xl border border-[#eee5dc] px-5 py-3 text-sm font-semibold text-[#49313e] hover:bg-[#faf8f5] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => void handleStatusUpdate()}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:opacity-50 ${
                  actionUser.isBlocked
                    ? "bg-green-700 hover:bg-green-800"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isUpdatingStatus ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : actionUser.isBlocked ? (
                  <Unlock size={16} />
                ) : (
                  <Lock size={16} />
                )}

                {isUpdatingStatus
                  ? "Updating..."
                  : actionUser.isBlocked
                    ? "Confirm unblock"
                    : "Confirm block"}
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
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#eee5dc] bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-[#81777a]">{label}</p>

        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f6eee4] text-[#9a7045]">
          {icon}
        </span>
      </div>

      <p className="mt-4 text-2xl font-bold text-[#49313e]">
        {value}
      </p>
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${
        role === "vendor"
          ? "bg-purple-50 text-purple-700"
          : "bg-blue-50 text-blue-700"
      }`}
    >
      {role}
    </span>
  );
}

function StatusBadge({ isBlocked }: { isBlocked: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
        isBlocked
          ? "bg-red-50 text-red-700"
          : "bg-green-50 text-green-700"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isBlocked ? "bg-red-500" : "bg-green-500"
        }`}
      />

      {isBlocked ? "Blocked" : "Active"}
    </span>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-[#9a7045]">{icon}</span>

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-[#a39799]">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-medium capitalize text-[#49313e]">
          {value}
        </p>
      </div>
    </div>
  );
}

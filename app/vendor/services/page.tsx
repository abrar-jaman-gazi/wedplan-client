
"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Edit3,
  ImagePlus,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { uploadImageFile } from "@/lib/upload-image";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

const CATEGORIES = [
  "Photography & Videography",
  "Wedding Venues",
  "Decoration & Florist",
  "Catering Services",
  "Makeup & Styling",
  "Wedding Fashion",
];

type Service = {
  _id: string;
  serviceName: string;
  category: string;
  description: string;
  price: number;
  location: string;
  images: string[];
  status: "active" | "inactive";
  approvalStatus: "pending" | "approved" | "rejected";
  rejectionReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type ServiceForm = {
  serviceName: string;
  category: string;
  description: string;
  price: string;
  location: string;
  images: string;
};

const EMPTY_FORM: ServiceForm = {
  serviceName: "",
  category: "",
  description: "",
  price: "",
  location: "",
  images: "",
};

async function getAuthToken() {
  const response = await fetch(`${API_URL}/auth/token`, {
    credentials: "include",
  });

  const result = await response.json();

  if (!response.ok || !result.token) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  return result.token as string;
}

function getErrorMessage(result: any, fallback: string) {
  if (result?.errors && typeof result.errors === "object") {
    return Object.values(result.errors).join(" ");
  }

  return result?.message || result?.error || fallback;
}

function formatPrice(price: number) {
  return `BDT ${Number(price).toLocaleString("en-BD")}`;
}

function formatDate(date?: string) {
  if (!date) return "Not available";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "Not available";

  return parsed.toLocaleDateString("en-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700",
    approved: "bg-emerald-50 text-emerald-700",
    rejected: "bg-red-50 text-red-700",
    active: "bg-emerald-50 text-emerald-700",
    inactive: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${styles[status] || "bg-gray-100 text-gray-600"
        }`}
    >
      {status}
    </span>
  );
}

export default function VendorServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceForm>(EMPTY_FORM);

  const loadServices = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      if (!API_URL) {
        throw new Error("Backend API URL is not configured.");
      }

      const token = await getAuthToken();

      const response = await fetch(`${API_URL}/services/mine`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          getErrorMessage(result, "Could not load your services.")
        );
      }

      const records = Array.isArray(result.data)
        ? result.data
        : Array.isArray(result.services)
          ? result.services
          : [];

      setServices(records);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const openCreateModal = () => {
    setEditingService(null);
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setForm({
      serviceName: service.serviceName,
      category: service.category,
      description: service.description,
      price: String(service.price),
      location: service.location,
      images: service.images.join("\n"),
    });
    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  const handleImageSelection = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (files.length === 0) return;

    const existingImages = form.images
      .split(/[\n,]+/)
      .map((image) => image.trim())
      .filter(Boolean);

    if (existingImages.length + files.length > 8) {
      setError("You can upload a maximum of 8 images per service.");
      return;
    }

    setError("");
    setSuccess("");
    setUploadingImages(true);

    try {
      const token = await getAuthToken();
      const uploadedImages: string[] = [];

      for (const file of files) {
        const imageUrl = await uploadImageFile(file, token);
        uploadedImages.push(imageUrl);

        setForm((current) => ({
          ...current,
          images: [...current.images.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean), imageUrl].join("\n"),
        }));
      }

      setSuccess(
        `${uploadedImages.length} image${uploadedImages.length === 1 ? "" : "s"} uploaded successfully. Save the service to keep the changes.`
      );
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Could not upload the selected images."
      );
    } finally {
      setUploadingImages(false);
    }
  };


  const closeModal = () => {
    if (saving || uploadingImages) return;

    setModalOpen(false);
    setEditingService(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (uploadingImages) {
  setError("Please wait until all images finish uploading.");
  return;
}
    setError("");
    setSuccess("");

    const images = form.images
      .split(/[\n,]+/)
      .map((image) => image.trim())
      .filter(Boolean);

    const price = Number(form.price);

    if (!form.serviceName.trim() || form.serviceName.trim().length < 3) {
      setError("Service name must contain at least 3 characters.");
      return;
    }

    if (!form.category) {
      setError("Please select a service category.");
      return;
    }

    if (
      form.description.trim().length < 20 ||
      form.description.trim().length > 2000
    ) {
      setError("Description must contain 20 to 2000 characters.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setError("Enter a valid non-negative price.");
      return;
    }

    if (
      form.location.trim().length < 2 ||
      form.location.trim().length > 150
    ) {
      setError("Location must contain 2 to 150 characters.");
      return;
    }

    if (images.length < 1 || images.length > 8) {
      setError("Provide between 1 and 8 image URLs.");
      return;
    }

    for (const image of images) {
      try {
        const parsed = new URL(image);

        if (!["http:", "https:"].includes(parsed.protocol)) {
          throw new Error();
        }
      } catch {
        setError("Every image must be a valid HTTP or HTTPS URL.");
        return;
      }
    }

    const payload = {
      serviceName: form.serviceName.trim(),
      category: form.category,
      description: form.description.trim(),
      price,
      location: form.location.trim(),
      images,
    };

    setSaving(true);

    try {
      const token = await getAuthToken();
      const isEditing = Boolean(editingService);

      const endpoint = isEditing
        ? `${API_URL}/services/${editingService!._id}`
        : `${API_URL}/services`;

      const response = await fetch(endpoint, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          getErrorMessage(result, "Could not save your service.")
        );
      }

      setModalOpen(false);
      setEditingService(null);
      setForm(EMPTY_FORM);
      setSuccess(
        isEditing
          ? "Service updated successfully. It may require admin approval again."
          : "Service submitted successfully. It is awaiting admin approval."
      );

      await loadServices();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save your service."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (service: Service) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${service.serviceName}"?`
    );

    if (!confirmed) return;

    setDeletingId(service._id);
    setError("");
    setSuccess("");

    try {
      const token = await getAuthToken();

      const response = await fetch(
        `${API_URL}/services/${service._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.success === false) {
        throw new Error(
          getErrorMessage(result, "Could not delete this service.")
        );
      }

      setSuccess("Service deleted successfully.");
      await loadServices();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete this service."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const activeServices = services.filter(
    (service) =>
      service.status === "active" &&
      service.approvalStatus === "approved"
  ).length;

  const pendingServices = services.filter(
    (service) => service.approvalStatus === "pending"
  ).length;

  const rejectedServices = services.filter(
    (service) => service.approvalStatus === "rejected"
  ).length;

  return (
    <main className="min-h-screen bg-[#faf8f5] px-5 py-8 text-[#402c38] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-9 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/vendor/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#6d5963] transition hover:text-[#a77946]"
          >
            <ArrowLeft size={18} />
            Back to dashboard
          </Link>

          <button
            type="button"
            onClick={loadServices}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#eadfd4] bg-white px-4 py-3 text-sm font-semibold transition hover:bg-[#f7efe6] disabled:opacity-50"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <section className="mb-9 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-[#a77946]">
              Vendor workspace
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Manage Your Services
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#897d82] sm:text-lg">
              Create, update, and manage the wedding services you offer to
              customers.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#49323f] px-6 py-4 font-semibold text-white transition hover:bg-[#604354]"
          >
            <Plus size={19} />
            Add New Service
          </button>
        </section>

        {error && !modalOpen && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <XCircle size={19} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
            <p>{success}</p>
          </div>
        )}

        <section className="mb-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Total services",
              value: services.length,
              icon: BriefcaseBusiness,
            },
            {
              label: "Active services",
              value: activeServices,
              icon: CheckCircle2,
            },
            {
              label: "Pending approval",
              value: pendingServices,
              icon: Clock3,
            },
            {
              label: "Rejected services",
              value: rejectedServices,
              icon: XCircle,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-2xl border border-[#eee2d7] bg-white p-6"
              >
                <div className="mb-5 flex items-center justify-between">
                  <p className="text-sm text-[#897d82]">{item.label}</p>
                  <span className="rounded-xl bg-[#f7efe6] p-3 text-[#a77946]">
                    <Icon size={20} />
                  </span>
                </div>
                <p className="text-3xl font-bold">{item.value}</p>
              </div>
            );
          })}
        </section>

        <section>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">Your service listings</h2>
              <p className="mt-1 text-sm text-[#897d82]">
                Services submitted by your vendor account.
              </p>
            </div>
            <p className="text-sm text-[#897d82]">
              {services.length} {services.length === 1 ? "service" : "services"}
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center rounded-2xl border border-[#eee2d7] bg-white">
              <div className="text-center">
                <Loader2
                  size={32}
                  className="mx-auto animate-spin text-[#a77946]"
                />
                <p className="mt-3 text-sm text-[#897d82]">
                  Loading your services...
                </p>
              </div>
            </div>
          ) : services.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#dfd0c2] bg-white px-6 py-16 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f7efe6] text-[#a77946]">
                <BriefcaseBusiness size={29} />
              </span>
              <h3 className="mt-5 text-xl font-bold">
                No services listed yet
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#897d82]">
                Add your first wedding service to start presenting your
                business to potential customers.
              </p>
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#49323f] px-5 py-3 font-semibold text-white transition hover:bg-[#604354]"
              >
                <Plus size={18} />
                Create your first service
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {services.map((service) => (
                <article
                  key={service._id}
                  className="overflow-hidden rounded-2xl border border-[#eee2d7] bg-white shadow-sm"
                >
                  <div className="relative h-52 bg-[#f5eee7]">
                    {service.images?.[0] ? (
                      <img
                        src={service.images[0]}
                        alt={service.serviceName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[#b18a60]">
                        <ImagePlus size={42} />
                      </div>
                    )}
                    <div className="absolute right-4 top-4">
                      <StatusBadge status={service.approvalStatus} />
                    </div>
                  </div>

                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#a77946]">
                      {service.category}
                    </p>

                    <h3 className="mt-2 text-xl font-bold">
                      {service.serviceName}
                    </h3>

                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#897d82]">
                      {service.description}
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-sm text-[#897d82]">
                      <MapPin size={16} className="shrink-0 text-[#a77946]" />
                      <span>{service.location}</span>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-[#f0e7df] pt-4">
                      <div>
                        <p className="text-xs text-[#a09599]">Service price</p>
                        <p className="mt-1 text-lg font-bold">
                          {formatPrice(service.price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[#a09599]">Availability</p>
                        <div className="mt-1">
                          <StatusBadge status={service.status} />
                        </div>
                      </div>
                    </div>

                    {service.approvalStatus === "rejected" &&
                      service.rejectionReason && (
                        <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                          <p className="font-semibold">Admin feedback</p>
                          <p className="mt-1">{service.rejectionReason}</p>
                        </div>
                      )}

                    <p className="mt-4 text-xs text-[#a09599]">
                      Last updated: {formatDate(service.updatedAt)}
                    </p>

                    <div className="mt-5 flex gap-3">
                      <button
                        type="button"
                        onClick={() => openEditModal(service)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#e9ddd1] px-3 py-3 text-sm font-semibold transition hover:bg-[#faf5ef]"
                      >
                        <Edit3 size={16} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(service)}
                        disabled={deletingId === service._id}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-100 px-3 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId === service._id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
            <div className="my-6 w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#eee2d7] p-6">
                <div>
                  <h2 className="text-xl font-bold">
                    {editingService ? "Edit service" : "Add a new service"}
                  </h2>
                  <p className="mt-1 text-sm text-[#897d82]">
                    Complete the information about your wedding service.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving || uploadingImages}
                  className="rounded-lg p-2 transition hover:bg-[#f7efe6]"
                  aria-label="Close form"
                >
                  <X size={21} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 p-6">
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div>

                  <div>
                    <label
                      htmlFor="service-images"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Service images
                    </label>

                    <div className="rounded-xl border border-dashed border-[#d9c7b7] bg-[#faf8f5] p-5">
                      <div className="flex flex-col items-center text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f0e4d5] text-[#a77946]">
                          {uploadingImages ? (
                            <Loader2 size={23} className="animate-spin" />
                          ) : (
                            <ImagePlus size={23} />
                          )}
                        </span>

                        <p className="mt-3 text-sm font-semibold">
                          {uploadingImages ? "Uploading images..." : "Upload service images"}
                        </p>

                        <p className="mt-1 text-xs text-[#a09599]">
                          JPEG, PNG, WebP, or GIF · Maximum 5 MB per image
                        </p>

                        <input
                          id="service-images"
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          multiple
                          onChange={handleImageSelection}
                          disabled={uploadingImages || saving}
                          className="mt-4 block w-full max-w-xs text-sm text-[#76646c] file:mr-3 file:rounded-lg file:border-0 file:bg-[#49323f] file:px-4 file:py-2.5 file:font-semibold file:text-white hover:file:bg-[#604354] disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label
                        htmlFor="service-image-urls"
                        className="mb-2 block text-xs font-semibold text-[#76646c]"
                      >
                        Uploaded image URLs
                      </label>

                      <textarea
                        id="service-image-urls"
                        value={form.images}
                        onChange={(event) =>
                          setForm({ ...form, images: event.target.value })
                        }
                        rows={3}
                        required
                        placeholder="Uploaded image URLs will appear here."
                        className="w-full resize-y rounded-xl border border-[#e8ddd3] px-4 py-3 outline-none focus:border-[#a77946]"
                      />
                      <p className="mt-1 text-xs text-[#a09599]">
                        You can keep existing URLs or remove any you no longer need. Add 1–8
                        images in total.
                      </p>
                    </div>

                    {form.images.trim() && (
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {form.images
                          .split(/[\n,]+/)
                          .map((image) => image.trim())
                          .filter(Boolean)
                          .map((image, index) => (
                            <div
                              key={`${image}-${index}`}
                              className="overflow-hidden rounded-xl border border-[#eee2d7] bg-white"
                            >
                              <img
                                src={image}
                                alt={`Service preview ${index + 1}`}
                                className="h-24 w-full object-cover"
                              />
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  <input
                    value={form.serviceName}
                    onChange={(event) =>
                      setForm({ ...form, serviceName: event.target.value })
                    }
                    maxLength={100}
                    required
                    placeholder="e.g. Premium Wedding Photography"
                    className="w-full rounded-xl border border-[#e8ddd3] px-4 py-3 outline-none transition focus:border-[#a77946]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(event) =>
                      setForm({ ...form, category: event.target.value })
                    }
                    required
                    className="w-full rounded-xl border border-[#e8ddd3] bg-white px-4 py-3 outline-none focus:border-[#a77946]"
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm({ ...form, description: event.target.value })
                    }
                    minLength={20}
                    maxLength={2000}
                    rows={4}
                    required
                    placeholder="Describe what your wedding service includes..."
                    className="w-full resize-y rounded-xl border border-[#e8ddd3] px-4 py-3 outline-none focus:border-[#a77946]"
                  />
                  <p className="mt-1 text-xs text-[#a09599]">
                    20–2000 characters
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Price (BDT)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(event) =>
                        setForm({ ...form, price: event.target.value })
                      }
                      required
                      placeholder="25000"
                      className="w-full rounded-xl border border-[#e8ddd3] px-4 py-3 outline-none focus:border-[#a77946]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Location
                    </label>
                    <input
                      value={form.location}
                      onChange={(event) =>
                        setForm({ ...form, location: event.target.value })
                      }
                      maxLength={150}
                      required
                      placeholder="e.g. Dhaka, Bangladesh"
                      className="w-full rounded-xl border border-[#e8ddd3] px-4 py-3 outline-none focus:border-[#a77946]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Image URLs
                  </label>
                  <textarea
                    value={form.images}
                    onChange={(event) =>
                      setForm({ ...form, images: event.target.value })
                    }
                    rows={3}
                    required
                    placeholder={"Paste image URLs, one per line\nhttps://example.com/image.jpg"}
                    className="w-full resize-y rounded-xl border border-[#e8ddd3] px-4 py-3 outline-none focus:border-[#a77946]"
                  />
                  <p className="mt-1 text-xs text-[#a09599]">
                    Add 1–8 HTTP or HTTPS image URLs, one per line.
                  </p>
                </div>

                <div className="rounded-xl bg-[#faf5ef] p-4 text-sm leading-6 text-[#76646c]">
                  {editingService
                    ? "Updating a service may send it back to pending approval. The admin must approve it before it appears publicly."
                    : "New services are submitted for admin approval. They will not appear in the public marketplace until approved and activated."}
                </div>

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="rounded-xl border border-[#e8ddd3] px-5 py-3 text-sm font-semibold transition hover:bg-[#faf5ef] disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#49323f] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#604354] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving && (
                      <Loader2 size={17} className="animate-spin" />
                    )}
                    {saving
                      ? "Saving..."
                      : editingService
                        ? "Update service"
                        : "Submit for approval"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

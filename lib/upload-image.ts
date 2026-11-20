
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export async function uploadImageFile(file: File, token: string) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Choose a JPEG, PNG, WebP, or GIF image.");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Each image must be 5 MB or smaller.");
  }

  if (!API_URL) {
    throw new Error("Backend API URL is not configured.");
  }

  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${API_URL}/uploads/image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: formData,
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false || !result.data?.url) {
    throw new Error(
      result.message || "Could not upload the image. Please try again."
    );
  }

  return result.data.url as string;
}

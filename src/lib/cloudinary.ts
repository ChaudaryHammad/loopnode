import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { env } from "@/lib/env";

const PROFILE_FOLDER = "loopnode/profiles";
const PAYMENT_PROOF_FOLDER = "loopnode/payment-proofs";
export const REPORTS_FOLDER = "loopnode/reports";

cloudinary.config({
  cloud_name: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export function getProfileImagePublicId(userId: string) {
  return `${PROFILE_FOLDER}/${userId}`;
}

export function isOurCloudinaryUrl(url: string | null | undefined) {
  if (!url) return false;
  return url.includes(
    `res.cloudinary.com/${env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/`
  );
}

export async function uploadProfileImage(
  userId: string,
  file: Buffer,
  mimeType: string
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: PROFILE_FOLDER,
        public_id: userId,
        overwrite: true,
        invalidate: true,
        resource_type: "image",
        format: mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg",
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve(result);
      }
    );

    uploadStream.end(file);
  });
}

export async function uploadPaymentProof(
  userId: string,
  file: Buffer,
  mimeType: string
): Promise<UploadApiResponse> {
  const publicId = `${userId}-${Date.now()}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: PAYMENT_PROOF_FOLDER,
        public_id: publicId,
        resource_type: "image",
        format: mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg",
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve(result);
      }
    );

    uploadStream.end(file);
  });
}

export async function deleteProfileImage(userId: string) {
  const publicId = getProfileImagePublicId(userId);
  const result = await cloudinary.uploader.destroy(publicId, {
    invalidate: true,
    resource_type: "image",
  });

  return result;
}

/** Full Cloudinary public id, e.g. loopnode/reports/{userId}/{reportId} */
export function getReportPublicId(userId: string, reportId: string, format: "pdf" | "csv") {
  const base = `${REPORTS_FOLDER}/${userId}/${reportId}`;
  return format === "csv" ? `${base}.csv` : base;
}

function getReportResourceType(format: "pdf" | "csv"): "image" | "raw" {
  return format === "pdf" ? "image" : "raw";
}

function resolveResourcePublicId(publicId: string, format: "pdf" | "csv") {
  return format === "csv" && !publicId.endsWith(".csv") ? `${publicId}.csv` : publicId;
}

/** Remove SDK analytics query params from delivery URLs. */
export function cleanCloudinaryUrl(url: string) {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("_a");
    return parsed.toString();
  } catch {
    return url.split("?")[0] ?? url;
  }
}

export async function uploadReportFile(
  userId: string,
  reportId: string,
  file: Buffer,
  format: "pdf" | "csv"
): Promise<UploadApiResponse> {
  const resourceType = getReportResourceType(format);
  const publicId =
    format === "csv" ? `${userId}/${reportId}.csv` : `${userId}/${reportId}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: REPORTS_FOLDER,
        public_id: publicId,
        resource_type: resourceType,
        ...(format === "pdf" ? { format: "pdf" } : {}),
        overwrite: true,
        invalidate: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary report upload failed"));
          return;
        }
        resolve(result);
      }
    );

    uploadStream.end(file);
  });
}

/** Fetch the real delivery URL (correct version) from Cloudinary. */
export async function getReportDeliveryUrl(report: {
  fileUrl: string;
  cloudinaryPublicId: string | null;
  format: "pdf" | "csv";
}) {
  if (!report.cloudinaryPublicId) {
    return cleanCloudinaryUrl(report.fileUrl);
  }

  const resourceType = getReportResourceType(report.format);
  const publicId = resolveResourcePublicId(report.cloudinaryPublicId, report.format);

  try {
    const resource = await cloudinary.api.resource(publicId, {
      resource_type: resourceType,
    });
    return cleanCloudinaryUrl(resource.secure_url);
  } catch (error) {
    // Legacy PDFs were uploaded as raw before image delivery was enabled.
    if (report.format === "pdf") {
      try {
        const legacy = await cloudinary.api.resource(publicId, {
          resource_type: "raw",
        });
        return cleanCloudinaryUrl(legacy.secure_url);
      } catch {
        console.warn("Cloudinary legacy raw lookup failed:", error);
      }
    }

    return cleanCloudinaryUrl(report.fileUrl);
  }
}

/** App routes for authenticated preview/download (avoids broken v1 SDK URLs). */
export function getReportFileRouteUrls(reportId: string) {
  const base = `/api/reports/${reportId}/file`;
  return {
    previewUrl: `${base}?disposition=inline`,
    downloadUrl: `${base}?disposition=attachment`,
  };
}

export function resolveReportUrls(report: { id: string }) {
  return getReportFileRouteUrls(report.id);
}

export async function deleteReportFile(publicId: string, format: "pdf" | "csv") {
  const resourceType = getReportResourceType(format);
  const id = resolveResourcePublicId(publicId, format);

  const result = await cloudinary.uploader.destroy(id, {
    invalidate: true,
    resource_type: resourceType,
  });

  if (format === "pdf" && result.result !== "ok") {
    await cloudinary.uploader.destroy(id, {
      invalidate: true,
      resource_type: "raw",
    });
  }

  return result;
}

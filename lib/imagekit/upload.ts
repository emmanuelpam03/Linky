import { Buffer } from "node:buffer";
import { getImageKitClient } from "@/lib/imagekit";

export const IMAGE_MAX_BYTES = 2 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type ImageValidationError = {
  success: false;
  error: string;
};

export function validateImageFile(
  file: File | null,
): ImageValidationError | null {
  if (!file) {
    return { success: false, error: "No file provided" };
  }

  if (
    !ALLOWED_IMAGE_TYPES.includes(
      file.type as (typeof ALLOWED_IMAGE_TYPES)[number],
    )
  ) {
    return {
      success: false,
      error: "Only JPG, PNG, or WebP files are allowed",
    };
  }

  if (file.size > IMAGE_MAX_BYTES) {
    return { success: false, error: "File must be under 2MB" };
  }

  return null;
}

export type UploadImageOptions = {
  folder: string;
  publicId: string;
  overwrite?: boolean;
};

export async function uploadImageToImageKit(
  file: File,
  options: UploadImageOptions,
) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const client = getImageKitClient();

  return client.files.upload({
    file: buffer,
    fileName: `${options.publicId}.${file.name.split(".").pop() || "jpg"}`,
    folder: options.folder,
    useUniqueFileName: false,
    overwriteFile: options.overwrite ?? true,
    overwriteAITags: options.overwrite ?? true,
    overwriteTags: options.overwrite ?? true,
    overwriteCustomMetadata: options.overwrite ?? true,
    tags: ["messenger"],
  });
}

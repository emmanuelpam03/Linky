import sharp from "sharp";
import { getImageKitClient } from "@/lib/imagekit";

export const IMAGE_MAX_BYTES = 2 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type ImageFormat = "jpeg" | "png" | "webp";

export type ImageValidationError = {
  success: false;
  error: string;
};

export type ImageValidationResult =
  | ImageValidationError
  | {
      success: true;
      format: ImageFormat;
    };

async function detectImageFormat(bytes: Uint8Array): Promise<ImageFormat | null> {
  try {
    const metadata = await sharp(bytes).metadata();

    switch (metadata.format) {
      case "jpeg":
      case "png":
      case "webp":
        return metadata.format;
      default:
        return null;
    }
  } catch {
    return null;
  }
}

export async function validateImageFile(
  file: FormDataEntryValue | null,
): Promise<ImageValidationResult> {
  if (!(file instanceof File)) {
    return { success: false, error: "No file provided" };
  }

  if (file.size > IMAGE_MAX_BYTES) {
    return { success: false, error: "File must be under 2MB" };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const format = await detectImageFormat(bytes);

  if (!format) {
    return {
      success: false,
      error: "The selected file is not a valid JPG, PNG, or WebP image",
    };
  }

  return { success: true, format };
}

export type UploadImageOptions = {
  folder: string;
  publicId: string;
  overwrite?: boolean;
};

export async function uploadImageToImageKit(
  file: File,
  options: UploadImageOptions,
  verifiedFormat: ImageFormat,
) {
  const client = getImageKitClient();
  const extension = verifiedFormat === "jpeg" ? "jpg" : verifiedFormat;

  return client.files.upload({
    file,
    fileName: `${options.publicId}.${extension}`,
    folder: options.folder,
    useUniqueFileName: false,
    overwriteFile: options.overwrite ?? true,
    overwriteAITags: options.overwrite ?? true,
    overwriteTags: options.overwrite ?? true,
    overwriteCustomMetadata: options.overwrite ?? true,
    tags: ["messenger"],
  });
}

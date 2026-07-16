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

function detectImageFormat(bytes: Uint8Array): ImageFormat | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "jpeg";
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "png";
  }

  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "webp";
  }

  return null;
}

export async function validateImageFile(
  file: File | null,
): Promise<ImageValidationResult> {
  if (!file) {
    return { success: false, error: "No file provided" };
  }

  if (file.size > IMAGE_MAX_BYTES) {
    return { success: false, error: "File must be under 2MB" };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const format = detectImageFormat(bytes);

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
  verifiedFormat?: ImageFormat,
) {
  const client = getImageKitClient();
  const extension = verifiedFormat === "jpeg" ? "jpg" : verifiedFormat ?? "jpg";

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

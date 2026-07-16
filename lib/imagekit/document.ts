import sharp from "sharp";
import { getImageKitClient } from "@/lib/imagekit";

export const DOCUMENT_MAX_BYTES = 50 * 1024 * 1024; // 50MB

export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
] as const;

export type DocumentFormat =
  | "pdf"
  | "doc"
  | "docx"
  | "xls"
  | "xlsx"
  | "txt"
  | "csv"
  | "jpeg"
  | "png"
  | "webp";

export type DocumentValidationError = {
  success: false;
  error: string;
};

export type DocumentValidationResult =
  | DocumentValidationError
  | {
      success: true;
      format: DocumentFormat;
      mimeType: string;
    };

async function detectDocumentFormat(
  bytes: Uint8Array,
  fileName: string,
  mimeType: string,
): Promise<DocumentFormat | null> {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const isPdfSignature =
    bytes.length >= 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46;
  const isOle2Signature =
    bytes.length >= 8 &&
    bytes[0] === 0xd0 &&
    bytes[1] === 0xcf &&
    bytes[2] === 0x11 &&
    bytes[3] === 0xe0;
  const isZipSignature =
    bytes.length >= 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    bytes[2] === 0x03 &&
    bytes[3] === 0x04;

  if (mimeType.includes("pdf") || ext === "pdf") {
    return isPdfSignature ? "pdf" : null;
  }

  if (mimeType.includes("jpeg") || mimeType.includes("jpg") || ext === "jpg" || ext === "jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 ? "jpeg" : null;
  }

  if (mimeType.includes("png") || ext === "png") {
    return bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 ? "png" : null;
  }

  if (mimeType.includes("webp") || ext === "webp") {
    return bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50 ? "webp" : null;
  }

  if (
    mimeType.includes("openxmlformats-officedocument.wordprocessingml.document") ||
    ext === "docx"
  ) {
    return isZipSignature ? "docx" : null;
  }

  if (mimeType.includes("word") || mimeType.includes("document") || ext === "doc") {
    return isOle2Signature ? "doc" : null;
  }

  if (
    mimeType.includes("openxmlformats-officedocument.spreadsheetml.sheet") ||
    ext === "xlsx"
  ) {
    return isZipSignature ? "xlsx" : null;
  }

  if (mimeType.includes("sheet") || mimeType.includes("excel") || ext === "xls") {
    return isOle2Signature ? "xls" : null;
  }

  if (mimeType.includes("plain") || ext === "txt") {
    return "txt";
  }

  if (mimeType.includes("csv") || ext === "csv") {
    return "csv";
  }

  return null;
}

export async function validateDocumentFile(
  file: FormDataEntryValue | null,
): Promise<DocumentValidationResult> {
  if (!(file instanceof File)) {
    return { success: false, error: "No file provided" };
  }

  if (file.size > DOCUMENT_MAX_BYTES) {
    return { success: false, error: "File must be under 50MB" };
  }

  if (
    !ALLOWED_DOCUMENT_TYPES.includes(
      file.type as (typeof ALLOWED_DOCUMENT_TYPES)[number],
    )
  ) {
    return {
      success: false,
      error:
        "Only PDF, Word, Excel, plain text, and CSV files are allowed",
    };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const format = await detectDocumentFormat(bytes, file.name, file.type);

  if (!format) {
    return {
      success: false,
      error: "The selected file could not be recognized as a valid document",
    };
  }

  return { success: true, format, mimeType: file.type };
}

export type UploadDocumentOptions = {
  folder: string;
  publicId: string;
  overwrite?: boolean;
};

export async function uploadDocumentToImageKit(
  file: File,
  options: UploadDocumentOptions,
  verifiedFormat: DocumentFormat,
) {
  const client = getImageKitClient();
  const ext = verifiedFormat === "xlsx" ? "xlsx" : verifiedFormat;

  return client.files.upload({
    file,
    fileName: `${options.publicId}.${ext}`,
    folder: options.folder,
    useUniqueFileName: false,
    overwriteFile: options.overwrite ?? true,
    overwriteAITags: options.overwrite ?? true,
    overwriteTags: options.overwrite ?? true,
    overwriteCustomMetadata: options.overwrite ?? true,
    tags: ["messenger-document"],
  });
}

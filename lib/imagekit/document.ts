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
] as const;

export type DocumentFormat =
  | "pdf"
  | "doc"
  | "docx"
  | "xls"
  | "xlsx"
  | "txt"
  | "csv";

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
  // Check by MIME type and file extension as primary method
  const ext = fileName.split(".").pop()?.toLowerCase();

  if (mimeType.includes("pdf") || ext === "pdf") {
    // PDF signature check
    if (
      bytes.length >= 4 &&
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46
    ) {
      return "pdf";
    }
  }

  if (
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    ext === "doc" ||
    ext === "docx"
  ) {
    // DOCX is a ZIP file with specific structure
    if (ext === "docx") return "docx";
    // DOC has OLE2 signature
    if (
      bytes.length >= 8 &&
      bytes[0] === 0xd0 &&
      bytes[1] === 0xcf &&
      bytes[2] === 0x11 &&
      bytes[3] === 0xe0
    ) {
      return "doc";
    }
  }

  if (
    mimeType.includes("sheet") ||
    mimeType.includes("excel") ||
    ext === "xls" ||
    ext === "xlsx"
  ) {
    // XLSX is a ZIP file
    if (ext === "xlsx") return "xlsx";
    // XLS has OLE2 signature like DOC
    if (
      bytes.length >= 8 &&
      bytes[0] === 0xd0 &&
      bytes[1] === 0xcf &&
      bytes[2] === 0x11 &&
      bytes[3] === 0xe0
    ) {
      return "xls";
    }
  }

  if (mimeType.includes("plain") || ext === "txt") {
    return "txt";
  }

  if (mimeType.includes("csv") || ext === "csv") {
    return "csv";
  }

  // Fallback to extension if MIME type didn't match
  if (ext === "pdf") return "pdf";
  if (ext === "doc") return "doc";
  if (ext === "docx") return "docx";
  if (ext === "xls") return "xls";
  if (ext === "xlsx") return "xlsx";
  if (ext === "txt") return "txt";
  if (ext === "csv") return "csv";

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

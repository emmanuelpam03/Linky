"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type FilePreviewModalProps = {
  isOpen: boolean;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  onClose: () => void;
};

const FilePreviewModal = ({
  isOpen,
  fileUrl,
  fileName,
  fileSize,
  onClose,
}: FilePreviewModalProps) => {
  if (!isOpen) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const isPdf = fileName.toLowerCase().endsWith(".pdf");
  const fileExtension = fileName.split(".").pop()?.toUpperCase() || "FILE";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="w-full max-w-6xl h-[98vh] sm:h-[95vh] bg-(--color-background-primary) rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-(--color-border-tertiary) px-6 py-4">
            <div className="flex-1 min-w-0">
              <h2 className="truncate font-semibold text-(--color-text-primary)">
                {fileName}
              </h2>
              {fileSize && (
                <p className="text-xs text-(--color-text-tertiary)">
                  {formatFileSize(fileSize)}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="ml-4 shrink-0 rounded-lg p-2 text-(--color-text-tertiary) hover:bg-(--color-background-secondary) transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            {isPdf ? (
              <iframe
                src={fileUrl}
                className="w-full h-full border-none"
                title={fileName}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8">
                <div className="flex items-center justify-center size-16 rounded-full bg-(--color-background-secondary) mb-4">
                  <span className="text-2xl font-bold text-(--color-brand-400)">
                    {fileExtension.slice(0, 1)}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-(--color-text-primary) mb-1">
                  {fileExtension} Document
                </h3>
                <p className="text-sm text-(--color-text-tertiary) text-center mb-6">
                  Preview not available for this file type
                </p>
                <a
                  href={fileUrl}
                  download={fileName}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-(--color-brand-400) text-white hover:bg-(--color-brand-500) transition-colors font-medium"
                >
                  Download File
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default FilePreviewModal;

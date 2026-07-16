"use client";

import { useState, useRef } from "react";
import { Send, Loader2, FileUp, X } from "lucide-react";
import { sendMessage } from "@/app/actions/messages/send";
import {
  deleteUploadedDocument,
  uploadDocumentToMessage,
} from "@/app/actions/messages/upload";
import type { MessageItem } from "@/types";

type MessageComposerProps = {
  conversationId: string;
  onMessageSent: (message: MessageItem) => void;
  replyTo?: MessageItem | null;
  onCancelReply?: () => void;
};

const MessageComposer = ({
  conversationId,
  onMessageSent,
  replyTo = null,
  onCancelReply,
}: MessageComposerProps) => {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSubmittingRef = useRef(false);

  const handleSend = async () => {
    const trimmed = text.trim();
    if ((!trimmed && !selectedFile) || isSending || isUploadingFile || isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;
    setIsSending(true);
    setError(null);
    const originalText = text;
    const originalFile = selectedFile;

    let fileUrl: string | undefined;
    let imageUrl: string | undefined;
    let fileName: string | undefined;
    let fileSize: number | undefined;

    try {
      if (selectedFile) {
        setIsUploadingFile(true);
        const formData = new FormData();
        formData.append("document", selectedFile);
        const uploadResult = await uploadDocumentToMessage(
          conversationId,
          formData,
        );
        setIsUploadingFile(false);

        if (!uploadResult.success) {
          setError(uploadResult.error ?? "File upload failed");
          return;
        }

        fileUrl = uploadResult.fileUrl ?? undefined;
        imageUrl = uploadResult.imageUrl ?? undefined;
        fileName = uploadResult.fileName ?? undefined;
        fileSize = uploadResult.fileSize ?? undefined;
      }

      const result = await sendMessage({
        conversationId,
        text: trimmed || undefined,
        fileUrl,
        imageUrl,
        fileName,
        fileSize,
        replyToId: replyTo?.id,
      });

      if (result.success && result.data) {
        onMessageSent(result.data as MessageItem);
        setText("");
        setSelectedFile(null);
      } else {
        const uploadedUrl = imageUrl ?? fileUrl;
        if (uploadedUrl) {
          try {
            await deleteUploadedDocument(uploadedUrl);
          } catch {
            // Ignore cleanup failures so the original send error remains visible.
          }
        }

        setText(originalText);
        setSelectedFile(originalFile);
        setError("Message could not be sent. Try again.");
      }
    } catch {
      const uploadedUrl = imageUrl ?? fileUrl;
      if (uploadedUrl) {
        try {
          await deleteUploadedDocument(uploadedUrl);
        } catch {
          // Ignore cleanup failures so the original send error remains visible.
        }
      }

      setText(originalText);
      setSelectedFile(originalFile);
      setError("Message could not be sent. Try again.");
    } finally {
      isSubmittingRef.current = false;
      setIsSending(false);
      setIsUploadingFile(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-(--color-border-tertiary) px-4 py-3">
      {selectedFile && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-(--color-background-secondary) p-2">
          <FileUp className="size-4 text-(--color-brand-400) shrink-0" />
          <span className="flex-1 truncate text-xs text-(--color-text-primary)">
            {selectedFile.name}
          </span>
          <button
            onClick={() => setSelectedFile(null)}
            aria-label="Remove attached file"
            disabled={isSending || isUploadingFile}
            className="shrink-0 rounded p-0.5 text-(--color-text-tertiary) hover:bg-(--color-background-tertiary) transition-colors"
          >
            <X className="size-3" />
          </button>
        </div>
      )}
      {replyTo && (
        <div className="mb-2 rounded-lg border border-(--color-border-secondary) bg-(--color-background-secondary) p-2">
          <div className="flex items-center justify-between">
            <div className="text-xs text-(--color-text-secondary)">Replying to {replyTo.sender.name}</div>
            <button onClick={onCancelReply} className="text-xs text-(--color-text-tertiary)">Cancel</button>
          </div>
          <div className="mt-1 truncate text-sm">{replyTo.text}</div>
        </div>
      )}
      <div className="flex items-center gap-2 rounded-xl border border-(--color-border-secondary) bg-(--color-background-primary) px-4 py-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.webp,.gif,.mp4,.mov,.webm,image/jpeg,image/png,image/webp,image/jpg,image/gif,video/mp4,video/quicktime,video/webm,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isSending || isUploadingFile}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach a file"
          disabled={isSending || isUploadingFile}
          className="shrink-0 rounded-lg p-1.5 text-(--color-text-tertiary) hover:text-(--color-brand-400) hover:bg-(--color-brand-50) transition-colors disabled:text-(--color-text-tertiary)"
        >
          <FileUp className="size-4" />
        </button>
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message or attach a file..."
          className="flex-1 bg-transparent text-sm text-(--color-text-primary) placeholder:text-(--color-text-tertiary) focus:outline-none"
          disabled={isSending || isUploadingFile}
        />
        <button
          onClick={handleSend}
          disabled={(!text.trim() && !selectedFile) || isSending || isUploadingFile}
          className="shrink-0 rounded-lg p-1.5 text-(--color-brand-400) disabled:text-(--color-text-tertiary) transition-colors hover:bg-(--color-brand-50)"
        >
          {isSending || isUploadingFile ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-(--color-coral-500)">{error}</p>}
    </div>
  );
};

export default MessageComposer;

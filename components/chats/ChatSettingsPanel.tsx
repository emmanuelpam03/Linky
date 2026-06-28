"use client";

import { useEffect, useState } from "react";
import { X, Loader2, FileText, Image as ImageIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ConversationDetail } from "@/types";
// import { deleteConversationForSelf } from "@/app/actions/conversations/delete";
import {
  getSharedMedia,
  getSharedFiles,
} from "@/app/actions/conversations/media";
import Image from "next/image";

type SharedMedia = { id: string; imageUrl: string; createdAt: Date };
type SharedFile = {
  id: string;
  fileUrl: string;
  fileName: string;
  fileSize: number | null;
  createdAt: Date;
};

type Tab = "media" | "files";

type ChatSettingsPanelProps = {
  conversation: ConversationDetail;
  onClose: () => void;
};

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ChatSettingsPanel({
  conversation,
  onClose,
}: ChatSettingsPanelProps) {
  const [tab, setTab] = useState<Tab>("media");
  const [media, setMedia] = useState<SharedMedia[]>([]);
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(true);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const { otherUser } = conversation;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setIsLoadingMedia(true);
        setIsLoadingFiles(true);

        const [mediaResult, filesResult] = await Promise.all([
          getSharedMedia(conversation.id),
          getSharedFiles(conversation.id),
        ]);

        if (!cancelled) {
          if (mediaResult.success) setMedia(mediaResult.data);
          if (filesResult.success) setFiles(filesResult.data);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMedia(false);
          setIsLoadingFiles(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [conversation.id]);

  const initials =
    otherUser?.name
      .split(" ")
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "?";

  return (
    <div className="flex h-full w-72 shrink-0 flex-col border-l border-(--color-border-tertiary) bg-(--color-background-primary)">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-(--color-border-tertiary) px-4 py-4">
        <h3 className="text-sm font-semibold text-(--color-text-primary)">
          Chat info
        </h3>
        <button
          onClick={onClose}
          aria-label="Close chat info"
          className="rounded-lg p-1.5 text-(--color-text-tertiary) hover:bg-(--color-background-secondary) transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* User profile */}
        <div className="flex flex-col items-center px-4 py-6 border-b border-(--color-border-tertiary)">
          <Avatar size="lg" style={{ width: 72, height: 72 }}>
            {otherUser?.image && (
              <AvatarImage src={otherUser.image} alt={otherUser.name} />
            )}
            <AvatarFallback className="bg-(--color-brand-50) text-xl font-semibold text-(--color-brand-900)">
              {initials}
            </AvatarFallback>
          </Avatar>
          <h2 className="mt-3 text-base font-semibold text-(--color-text-primary)">
            {otherUser?.name}
          </h2>
          <p className="text-sm text-(--color-text-secondary)">
            @{otherUser?.username}
          </p>
          {otherUser?.bio && (
            <p className="mt-2 text-center text-xs text-(--color-text-secondary) px-2 leading-relaxed">
              {otherUser.bio}
            </p>
          )}
        </div>

        {/* Media / Files tabs */}
        <div className="border-b border-(--color-border-tertiary)">
          <div className="flex">
            {(["media", "files"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors border-b-2 ${
                  tab === t
                    ? "border-(--color-brand-400) text-(--color-brand-600)"
                    : "border-transparent text-(--color-text-secondary) hover:text-(--color-text-primary)"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {tab === "media" && (
          <div className="px-3 py-3">
            {isLoadingMedia ? (
              <div className="flex justify-center py-6">
                <Loader2 className="size-5 animate-spin text-(--color-text-tertiary)" />
              </div>
            ) : media.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-2">
                <ImageIcon className="size-8 text-(--color-text-tertiary)" />
                <p className="text-xs text-(--color-text-tertiary)">
                  No media shared yet
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {media.map((m) => (
                  <a
                    key={m.id}
                    href={m.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square overflow-hidden rounded-md bg-(--color-background-secondary)"
                  >
                    <Image
                      src={m.imageUrl}
                      alt="Shared media"
                      width={200}
                      height={200}
                      className="h-full w-full object-cover"
                    />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "files" && (
          <div className="px-3 py-3">
            {isLoadingFiles ? (
              <div className="flex justify-center py-6">
                <Loader2 className="size-5 animate-spin text-(--color-text-tertiary)" />
              </div>
            ) : files.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-2">
                <FileText className="size-8 text-(--color-text-tertiary)" />
                <p className="text-xs text-(--color-text-tertiary)">
                  No files shared yet
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {files.map((f) => (
                  <a
                    key={f.id}
                    href={f.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-(--color-border-tertiary) px-3 py-2 hover:bg-(--color-background-secondary) transition-colors"
                  >
                    <FileText className="size-4 shrink-0 text-(--color-brand-400)" />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-(--color-text-primary)">
                        {f.fileName}
                      </p>

                      {f.fileSize && (
                        <p className="text-[10px] text-(--color-text-tertiary)">
                          {formatBytes(f.fileSize)}
                        </p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

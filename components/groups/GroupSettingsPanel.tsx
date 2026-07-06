"use client";

import { useEffect, useState } from "react";
import {
  X,
  Loader2,
  Image as ImageIcon,
  FileText,
  Link as LinkIcon,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { GroupDetail } from "@/types";
import {
  getSharedMedia,
  getSharedFiles,
  getSharedLinks,
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
type SharedLink = { id: string; url: string; createdAt: Date };
type Tab = "members" | "media" | "files" | "links";

type GroupSettingsPanelProps = {
  group: GroupDetail;
  onClose: () => void;
  onGroupUpdated: (updates: Partial<GroupDetail>) => void;
};

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isSafeHttpUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}

export default function GroupSettingsPanel({
  group,
  onClose,
}: GroupSettingsPanelProps) {
  const [tab, setTab] = useState<Tab>("members");
  const [media, setMedia] = useState<SharedMedia[]>([]);
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [links, setLinks] = useState<SharedLink[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (tab === "media" && media.length === 0) {
        setIsLoadingMedia(true);
        const r = await getSharedMedia(group.id);
        if (r.success) setMedia(r.data);
        setIsLoadingMedia(false);
      }
      if (tab === "files" && files.length === 0) {
        setIsLoadingFiles(true);
        const r = await getSharedFiles(group.id);
        if (r.success) setFiles(r.data);
        setIsLoadingFiles(false);
      }
      if (tab === "links" && links.length === 0) {
        setIsLoadingLinks(true);
        const r = await getSharedLinks(group.id);
        if (r.success) setLinks(r.data);
        setIsLoadingLinks(false);
      }
    };
    load();
  }, [tab, group.id, media.length, files.length, links.length]);

  const initials = group.name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-full w-72 shrink-0 flex-col border-l border-(--color-border-tertiary) bg-(--color-background-primary)">
      <div className="flex items-center justify-between border-b border-(--color-border-tertiary) px-4 py-4">
        <h3 className="text-sm font-semibold text-(--color-text-primary)">
          Group info
        </h3>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-(--color-text-tertiary) hover:bg-(--color-background-secondary) transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Profile */}
        <div className="flex flex-col items-center px-4 py-6 border-b border-(--color-border-tertiary)">
          <Avatar size="lg" style={{ width: 72, height: 72 }}>
            {group.image && <AvatarImage src={group.image} alt={group.name} />}
            <AvatarFallback className="bg-(--color-background-tertiary) text-xl font-semibold text-(--color-text-secondary)">
              {initials}
            </AvatarFallback>
          </Avatar>
          <h2 className="mt-3 text-base font-semibold text-(--color-text-primary)">
            {group.name}
          </h2>
          <p className="text-xs text-(--color-text-tertiary)">
            {group.memberCount} members
          </p>
          {group.description && (
            <p className="mt-2 text-center text-xs text-(--color-text-secondary) px-2 leading-relaxed">
              {group.description}
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-(--color-border-tertiary)">
          <div className="flex">
            {(["members", "media", "files", "links"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-[10px] font-medium capitalize transition-colors border-b-2 ${
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

        {tab === "members" && (
          <div className="px-3 py-3 space-y-1">
            {group.members.map((member) => {
              const mi = member.user.name
                .split(" ")
                .map((s) => s[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase();
              return (
                <div
                  key={member.id}
                  className="flex items-center gap-2 rounded-lg px-2 py-2"
                >
                  <Avatar size="sm">
                    {member.user.image && (
                      <AvatarImage
                        src={member.user.image}
                        alt={member.user.name}
                      />
                    )}
                    <AvatarFallback className="text-[10px] bg-(--color-brand-50) text-(--color-brand-900)">
                      {mi}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-(--color-text-primary) truncate">
                      {member.user.name}
                    </p>
                    <p className="text-[10px] text-(--color-text-tertiary)">
                      @{member.user.username}
                    </p>
                  </div>
                  {member.role === "ADMIN" && (
                    <Badge
                      variant="outline"
                      className="text-[9px] px-1 py-0 border-(--color-brand-200) text-(--color-brand-600)"
                    >
                      Admin
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}

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

        {tab === "links" && (
          <div className="px-3 py-3">
            {isLoadingLinks ? (
              <div className="flex justify-center py-6">
                <Loader2 className="size-5 animate-spin text-(--color-text-tertiary)" />
              </div>
            ) : links.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-2">
                <LinkIcon className="size-8 text-(--color-text-tertiary)" />
                <p className="text-xs text-(--color-text-tertiary)">
                  No links shared yet
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {links.map((l) => (
                  isSafeHttpUrl(l.url) ? (
                    <a
                      key={l.id}
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg border border-(--color-border-tertiary) px-3 py-2 hover:bg-(--color-background-secondary) transition-colors"
                    >
                      <LinkIcon className="size-4 shrink-0 text-(--color-brand-400)" />
                      <p className="truncate text-xs text-(--color-text-primary)">
                        {l.url}
                      </p>
                    </a>
                  ) : (
                    <div
                      key={l.id}
                      className="flex items-center gap-2 rounded-lg border border-(--color-border-tertiary) px-3 py-2"
                    >
                      <LinkIcon className="size-4 shrink-0 text-(--color-text-tertiary)" />
                      <p className="truncate text-xs text-(--color-text-secondary)">
                        {l.url}
                      </p>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

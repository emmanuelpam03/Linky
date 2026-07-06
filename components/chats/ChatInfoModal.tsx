"use client";

import { useEffect, useState } from "react";
import {
  X,
  Info,
  Image as ImageIcon,
  FileText,
  Link as LinkIcon,
  ShieldAlert,
  Trash2,
  Loader2,
  Bell,
  BellOff,
  Eraser,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ConversationDetail } from "@/types";
import {
  getSharedMedia,
  getSharedFiles,
  getSharedLinks,
} from "@/app/actions/conversations/media";
import { blockUser, getBlockStatus } from "@/app/actions/users/block";
import { deleteConversationForSelf } from "@/app/actions/conversations/delete";
import {
  toggleMute,
  getMuteStatus,
} from "@/app/actions/conversations/settings";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type SharedMedia = { id: string; imageUrl: string; createdAt: Date };
type SharedFile = {
  id: string;
  fileUrl: string;
  fileName: string;
  fileSize: number | null;
  createdAt: Date;
};
type SharedLink = { id: string; url: string; createdAt: Date };
type NavItem = "info" | "media" | "files" | "links";
type ConfirmDialogConfig = {
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "default" | "destructive";
  onConfirm: () => Promise<void> | void;
} | null;

type ChatInfoModalProps = {
  conversation: ConversationDetail;
  onClose: () => void;
  onClearChat: () => Promise<boolean>;
};

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export default function ChatInfoModal({
  conversation,
  onClose,
  onClearChat,
}: ChatInfoModalProps) {
  const [nav, setNav] = useState<NavItem>("info");
  const [media, setMedia] = useState<SharedMedia[]>([]);
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [links, setLinks] = useState<SharedLink[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);
  const [iBlocked, setIBlocked] = useState(false);
  const [theyBlocked, setTheyBlocked] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isTogglingMute, setIsTogglingMute] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogConfig>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { otherUser } = conversation;

  const handleBlock = () => {
    if (!otherUser) return;

    setConfirmDialog({
      title: iBlocked ? `Unblock ${otherUser.name}?` : `Block ${otherUser.name}?`,
      description: iBlocked
        ? `${otherUser.name} will be able to send you messages again.`
        : `${otherUser.name} won't be able to send you messages.`,
      confirmLabel: iBlocked ? "Unblock" : "Block",
      confirmVariant: "destructive",
      onConfirm: async () => {
        setIsBlocking(true);
        if (iBlocked) {
          const { unblockUser } = await import("@/app/actions/users/block");
          const result = await unblockUser(otherUser.id);
          if (result.success) {
            setIBlocked(false);
            toast({
              title: "User unblocked",
              description: `${otherUser.name} can send you messages again.`,
              variant: "success",
            });
          } else {
            toast({
              title: "Could not unblock user",
              description: result.error ?? "Try again.",
              variant: "error",
            });
          }
        } else {
          const result = await blockUser(otherUser.id);
          if (result.success) {
            setIBlocked(true);
            toast({
              title: "User blocked",
              description: `${otherUser.name} can no longer message you.`,
              variant: "success",
            });
          } else {
            toast({
              title: "Could not block user",
              description: result.error ?? "Try again.",
              variant: "error",
            });
          }
        }
        setIsBlocking(false);
      },
    });
  };

  const handleDelete = () => {
    setConfirmDialog({
      title: "Delete this conversation?",
      description: "This cannot be undone.",
      confirmLabel: "Delete",
      confirmVariant: "destructive",
      onConfirm: async () => {
        setIsDeleting(true);
        const r = await deleteConversationForSelf(conversation.id);
        if (r.success) {
          toast({
            title: "Conversation deleted",
            description: "It has been removed from your list.",
            variant: "success",
          });
          onClose();
          router.push("/chats");
        } else {
          toast({
            title: "Could not delete conversation",
            description: r.error ?? "Try again.",
            variant: "error",
          });
        }
        setIsDeleting(false);
      },
    });
  };

  const handleClearChat = () => {
    setConfirmDialog({
      title: "Clear all messages?",
      description: "This only affects your view.",
      confirmLabel: "Clear chat",
      confirmVariant: "destructive",
      onConfirm: async () => {
        setIsClearing(true);
        const success = await onClearChat();
        setIsClearing(false);
        if (success) onClose();
      },
    });
  };

  const handleToggleMute = async () => {
    setIsTogglingMute(true);
    const newMuted = !isMuted;
    const r = await toggleMute(conversation.id, newMuted);
    if (r.success) {
      setIsMuted(newMuted);
      toast({
        title: newMuted ? "Notifications off" : "Notifications on",
        description: newMuted
          ? `${otherUser?.name ?? "This chat"} is muted.`
          : `${otherUser?.name ?? "This chat"} can notify you again.`,
        variant: "success",
      });
    } else {
      toast({
        title: "Could not update notifications",
        description: r.error ?? "Try again.",
        variant: "error",
      });
    }
    setIsTogglingMute(false);
  };

  const initials =
    otherUser?.name
      .split(" ")
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "?";

  const navItems: { id: NavItem; label: string; icon: React.ReactNode }[] = [
    { id: "info", label: "Info", icon: <Info className="size-4" /> },
    { id: "media", label: "Media", icon: <ImageIcon className="size-4" /> },
    { id: "files", label: "Files", icon: <FileText className="size-4" /> },
    { id: "links", label: "Links", icon: <LinkIcon className="size-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div
        className="w-full max-w-2xl rounded-2xl border border-(--color-border-tertiary) bg-(--color-background-primary) shadow-xl overflow-hidden flex"
        style={{ height: 520 }}
      >
        {/* Left nav */}
        <div className="w-48 shrink-0 border-r border-(--color-border-tertiary) bg-(--color-background-secondary) p-3 flex flex-col">
          <p className="text-xs font-semibold text-(--color-text-tertiary) uppercase tracking-wide px-2 mb-2">
            Contact
          </p>
          <div className="flex flex-col gap-0.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setNav(item.id)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors text-left ${
                  nav === item.id
                    ? "bg-(--color-brand-50) text-(--color-brand-800) font-medium"
                    : "text-(--color-text-secondary) hover:bg-(--color-background-tertiary)"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right content */}
        <div className="flex flex-1 flex-col min-w-0">
          <div className="flex items-center justify-between border-b border-(--color-border-tertiary) px-5 py-4">
            <h2 className="text-sm font-semibold text-(--color-text-primary) capitalize">
              {nav}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-(--color-text-tertiary) hover:bg-(--color-background-secondary) transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* ── Info tab ────────────────────────────────────────────────── */}
            {nav === "info" && (
              <div>
                <div className="flex flex-col items-center px-6 py-8 border-b border-(--color-border-tertiary)">
                  <Avatar style={{ width: 80, height: 80 }}>
                    {otherUser?.image && (
                      <AvatarImage src={otherUser.image} alt={otherUser.name} />
                    )}
                    <AvatarFallback className="bg-(--color-brand-50) text-2xl font-semibold text-(--color-brand-900)">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="mt-4 text-lg font-semibold text-(--color-text-primary)">
                    {otherUser?.name}
                  </h3>
                  <p className="text-sm text-(--color-text-secondary)">
                    @{otherUser?.username}
                  </p>
                  {otherUser?.bio && (
                    <p className="mt-2 text-center text-sm text-(--color-text-secondary) max-w-xs leading-relaxed">
                      {otherUser.bio}
                    </p>
                  )}
                  {theyBlocked && (
                    <p className="mt-2 text-xs text-(--color-coral-400)">
                      This user has blocked you
                    </p>
                  )}
                </div>

                {/* Settings */}
                <div className="px-5 py-3 space-y-1">
                  {/* Mute toggle */}
                  <div className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-(--color-background-secondary) transition-colors">
                    <div className="flex items-center gap-3">
                      {isMuted ? (
                        <BellOff className="size-4 text-(--color-text-secondary)" />
                      ) : (
                        <Bell className="size-4 text-(--color-text-secondary)" />
                      )}
                      <span className="text-sm text-(--color-text-primary)">
                        {isMuted ? "Notifications off" : "Notifications on"}
                      </span>
                    </div>
                    <button
                      onClick={handleToggleMute}
                      disabled={isTogglingMute}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        isMuted
                          ? "bg-(--color-background-tertiary)"
                          : "bg-(--color-brand-400)"
                      }`}
                    >
                      {isTogglingMute ? (
                        <Loader2 className="size-3 animate-spin m-auto" />
                      ) : (
                        <span
                          className={`pointer-events-none inline-block size-4 rounded-full bg-white shadow transform transition-transform ${
                            isMuted ? "translate-x-0" : "translate-x-4"
                          }`}
                        />
                      )}
                    </button>
                  </div>

                  {/* Clear chat */}
                  <button
                    onClick={handleClearChat}
                    disabled={isClearing}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-(--color-text-secondary) hover:bg-(--color-background-secondary) transition-colors disabled:opacity-50"
                  >
                    {isClearing ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Eraser className="size-4" />
                    )}
                    Clear chat
                  </button>

                  {/* Block */}
                  <button
                    onClick={handleBlock}
                    disabled={isBlocking || theyBlocked}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-(--color-text-secondary) hover:bg-(--color-background-secondary) transition-colors disabled:opacity-50"
                  >
                    {isBlocking ? (
                      <Loader2 className="size-4 animate-spin text-(--color-coral-400)" />
                    ) : (
                      <ShieldAlert className="size-4 text-(--color-coral-400)" />
                    )}
                    {iBlocked ? "Unblock user" : "Block user"}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-(--color-coral-600) hover:bg-(--color-coral-50) transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                    Delete conversation
                  </button>
                </div>
              </div>
            )}

            {/* ── Media tab ───────────────────────────────────────────────── */}
            {nav === "media" && (
              <div className="p-4">
                {isLoadingMedia ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="size-6 animate-spin text-(--color-text-tertiary)" />
                  </div>
                ) : media.length === 0 ? (
                  <div className="flex flex-col items-center py-12 gap-3">
                    <ImageIcon className="size-10 text-(--color-text-tertiary)" />
                    <p className="text-sm text-(--color-text-tertiary)">
                      No media shared yet
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-1.5">
                    {media.map((m) => (
                      <a
                        key={m.id}
                        href={m.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-square overflow-hidden rounded-lg bg-(--color-background-secondary)"
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

            {/* ── Files tab ───────────────────────────────────────────────── */}
            {nav === "files" && (
              <div className="p-4">
                {isLoadingFiles ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="size-6 animate-spin text-(--color-text-tertiary)" />
                  </div>
                ) : files.length === 0 ? (
                  <div className="flex flex-col items-center py-12 gap-3">
                    <FileText className="size-10 text-(--color-text-tertiary)" />
                    <p className="text-sm text-(--color-text-tertiary)">
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
                        className="flex items-center gap-3 rounded-xl border border-(--color-border-tertiary) px-4 py-3 hover:bg-(--color-background-secondary) transition-colors"
                      >
                        <FileText className="size-5 shrink-0 text-(--color-brand-400)" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-(--color-text-primary)">
                            {f.fileName}
                          </p>
                          {f.fileSize && (
                            <p className="text-xs text-(--color-text-tertiary)">
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

            {/* ── Links tab ───────────────────────────────────────────────── */}
            {nav === "links" && (
              <div className="p-4">
                {isLoadingLinks ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="size-6 animate-spin text-(--color-text-tertiary)" />
                  </div>
                ) : links.length === 0 ? (
                  <div className="flex flex-col items-center py-12 gap-3">
                    <LinkIcon className="size-10 text-(--color-text-tertiary)" />
                    <p className="text-sm text-(--color-text-tertiary)">
                      No links shared yet
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {links.map((l) => (
                      <a
                        key={l.id}
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-xl border border-(--color-border-tertiary) px-4 py-3 hover:bg-(--color-background-secondary) transition-colors"
                      >
                        <LinkIcon className="size-5 shrink-0 text-(--color-brand-400)" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-(--color-text-primary)">
                            {l.url}
                          </p>
                          <p className="text-xs text-(--color-text-tertiary)">
                            {formatDate(l.createdAt)}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Done button */}
          <div className="border-t border-(--color-border-tertiary) px-5 py-3 flex justify-end">
            <button
              onClick={onClose}
              className="rounded-lg bg-(--color-brand-400) px-5 py-2 text-sm font-medium text-white hover:bg-(--color-brand-600) transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmDialog}
        title={confirmDialog?.title ?? ""}
        description={confirmDialog?.description ?? ""}
        confirmLabel={confirmDialog?.confirmLabel ?? "Confirm"}
        confirmVariant={confirmDialog?.confirmVariant ?? "destructive"}
        isLoading={isBlocking || isDeleting || isClearing}
        onCancel={() => setConfirmDialog(null)}
        onConfirm={async () => {
          const dialog = confirmDialog;
          setConfirmDialog(null);
          await dialog?.onConfirm();
        }}
      />
    </div>
  );
}

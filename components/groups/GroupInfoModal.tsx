"use client";

import { useEffect, useRef, useState } from "react";
import {
  X,
  Info,
  Image as ImageIcon,
  FileText,
  Users,
  Link as LinkIcon,
  Loader2,
  LogOut,
  Trash2,
  UserPlus,
  Upload,
  Pencil,
  Check,
  Search,
  Bell,
  BellOff,
  Eraser,
  Shield,
  UserMinus,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { GroupDetail, GroupMember } from "@/types";
import {
  getSharedMedia,
  getSharedFiles,
  getSharedLinks,
} from "@/app/actions/conversations/media";
import {
  addGroupMember,
  removeGroupMember,
  promoteToAdmin,
} from "@/app/actions/groups/members";
import {
  updateGroup,
  uploadGroupAvatar,
  deleteGroup,
} from "@/app/actions/groups/update";
import { searchUsersForGroup } from "@/app/actions/users/search";
import { toggleMute } from "@/app/actions/conversations/settings";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useDebounce } from "@/hooks/useDebounce";
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
type UserResult = {
  id: string;
  name: string;
  username: string;
  image: string | null;
};
type NavItem = "info" | "members" | "media" | "files" | "links";
type ConfirmDialogConfig = {
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "default" | "destructive";
  onConfirm: () => Promise<void> | void;
} | null;

type GroupInfoModalProps = {
  group: GroupDetail;
  onClose: () => void;
  onGroupUpdated: (updates: Partial<GroupDetail>) => void;
  onClearChat?: () => Promise<boolean>;
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

export default function GroupInfoModal({
  group,
  onClose,
  onGroupUpdated,
  onClearChat,
}: GroupInfoModalProps) {
  const [nav, setNav] = useState<NavItem>("info");
  const [media, setMedia] = useState<SharedMedia[]>([]);
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [links, setLinks] = useState<SharedLink[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);

  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {},
  );
  const [memberErrors, setMemberErrors] = useState<Record<string, string>>({});

  // Add member search
  const [addQuery, setAddQuery] = useState("");
  const [addResults, setAddResults] = useState<UserResult[]>([]);
  const [isAddSearching, setIsAddSearching] = useState(false);
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});
  const debouncedAddQuery = useDebounce(addQuery, 400);

  // Filter existing members
  const [filterQuery, setFilterQuery] = useState("");

  // Edit group info (admin only)
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [nameValue, setNameValue] = useState(group.name);
  const [descValue, setDescValue] = useState(group.description ?? "");
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingDesc, setIsSavingDesc] = useState(false);
  const [nameError, setNameError] = useState("");
  const [descError, setDescError] = useState("");

  // Avatar
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mute / clear / leave / delete
  const [isMuted, setIsMuted] = useState(group.isMuted);
  const [isTogglingMute, setIsTogglingMute] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogConfig>(null);

  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const isAdmin = group.currentUserRole === "ADMIN";
  const groupRef = useRef(group);
  useEffect(() => {
    groupRef.current = group;
  }, [group]);

  // Load media/files/links on nav change
  useEffect(() => {
    const load = async () => {
      if (nav === "media" && media.length === 0) {
        setIsLoadingMedia(true);
        const r = await getSharedMedia(group.id);
        if (r.success) setMedia(r.data);
        setIsLoadingMedia(false);
      }
      if (nav === "files" && files.length === 0) {
        setIsLoadingFiles(true);
        const r = await getSharedFiles(group.id);
        if (r.success) setFiles(r.data);
        setIsLoadingFiles(false);
      }
      if (nav === "links" && links.length === 0) {
        setIsLoadingLinks(true);
        const r = await getSharedLinks(group.id);
        if (r.success) setLinks(r.data);
        setIsLoadingLinks(false);
      }
    };
    load();
  }, [nav, group.id, media.length, files.length, links.length]);

  // Search users to add
  useEffect(() => {
    let cancelled = false;
    const search = async () => {
      if (!debouncedAddQuery.trim()) {
        setAddResults([]);
        return;
      }
      setIsAddSearching(true);
      const r = await searchUsersForGroup(debouncedAddQuery, group.id);
      if (cancelled) return;
      if (r.success) setAddResults(r.data);
      setIsAddSearching(false);
    };
    search();
    return () => {
      cancelled = true;
    };
  }, [debouncedAddQuery, group.id]);

  // Filtered members
  const filteredMembers = filterQuery.trim()
    ? group.members.filter(
        (m) =>
          m.user.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
          m.user.username.toLowerCase().includes(filterQuery.toLowerCase()),
      )
    : group.members;

  // ── Avatar ────────────────────────────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError("");
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const r = await uploadGroupAvatar(group.id, formData);
      if (!r.success) {
        setAvatarError(r.error ?? "Upload failed");
        toast({
          title: "Could not update avatar",
          description: r.error ?? "Try again.",
          variant: "error",
        });
      } else {
        const avatarUrl = r.imageUrl ?? null;
        setLocalAvatar(avatarUrl);
        onGroupUpdated({ image: avatarUrl });
        toast({
          title: "Group avatar updated",
          description: "The new avatar is visible immediately.",
          variant: "success",
        });
      }
    } catch {
      setAvatarError("Upload failed");
      toast({
        title: "Could not update avatar",
        description: "Try again.",
        variant: "error",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // ── Name ──────────────────────────────────────────────────────────────────
  const handleSaveName = async () => {
    if (!nameValue.trim()) {
      setNameError("Name cannot be empty");
      return;
    }
    setIsSavingName(true);
    setNameError("");
    try {
      const r = await updateGroup(group.id, { name: nameValue.trim() });
      if (!r.success) {
        setNameError(r.error ?? "Failed");
        toast({
          title: "Could not update group name",
          description: r.error ?? "Try again.",
          variant: "error",
        });
      } else {
        onGroupUpdated({ name: nameValue.trim() });
        setIsEditingName(false);
        toast({
          title: "Group name updated",
          description: "Changes were saved.",
          variant: "success",
        });
      }
    } catch {
      setNameError("Failed to update name");
      toast({
        title: "Could not update group name",
        description: "Try again.",
        variant: "error",
      });
    } finally {
      setIsSavingName(false);
    }
  };

  // ── Description ───────────────────────────────────────────────────────────
  const handleSaveDesc = async () => {
    setIsSavingDesc(true);
    setDescError("");
    try {
      const r = await updateGroup(group.id, { description: descValue.trim() });
      if (!r.success) {
        setDescError(r.error ?? "Failed");
        toast({
          title: "Could not update description",
          description: r.error ?? "Try again.",
          variant: "error",
        });
      } else {
        onGroupUpdated({ description: descValue.trim() });
        setIsEditingDesc(false);
        toast({
          title: "Group description updated",
          description: "Changes were saved.",
          variant: "success",
        });
      }
    } catch {
      setDescError("Failed to update description");
      toast({
        title: "Could not update description",
        description: "Try again.",
        variant: "error",
      });
    } finally {
      setIsSavingDesc(false);
    }
  };

  // ── Mute ──────────────────────────────────────────────────────────────────
  const handleToggleMute = async () => {
    setIsTogglingMute(true);
    const newMuted = !isMuted;
    const r = await toggleMute(group.id, newMuted);
    if (r.success) {
      setIsMuted(newMuted);
      onGroupUpdated({ isMuted: newMuted });
      toast({
        title: newMuted ? "Group notifications off" : "Group notifications on",
        description: newMuted
          ? "You will not be notified about new messages."
          : "Notifications are enabled again.",
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

  // ── Clear chat ────────────────────────────────────────────────────────────
  const handleClearChat = () => {
    if (!onClearChat) return;

    setConfirmDialog({
      title: "Clear all messages?",
      description: "This only affects your view.",
      confirmLabel: "Clear chat",
      confirmVariant: "destructive",
      onConfirm: async () => {
        setIsClearing(true);
        try {
          const success = await onClearChat();
          if (success) onClose();
        } catch (error) {
          toast({
            title: "Could not clear chat",
            description: "Try again.",
            variant: "error",
          });
          throw error;
        } finally {
          setIsClearing(false);
        }
      },
    });
  };

  // ── Add member ────────────────────────────────────────────────────────────
  const handleAddMember = async (user: UserResult) => {
    setActionLoading((prev) => ({ ...prev, [user.id]: true }));
    try {
      const r = await addGroupMember(groupRef.current.id, user.id);
      if (!r.success) {
        setAddErrors((prev) => ({ ...prev, [user.id]: r.error ?? "Failed" }));
        toast({
          title: "Could not add member",
          description: r.error ?? "Try again.",
          variant: "error",
        });
      } else {
        const newMember: GroupMember = {
          id: `new-${user.id}`,
          userId: user.id,
          role: "MEMBER",
          joinedAt: new Date(),
          user,
        };
        onGroupUpdated({
          members: [...groupRef.current.members, newMember],
          memberCount: groupRef.current.memberCount + 1,
        });
        setAddResults((prev) => prev.filter((u) => u.id !== user.id));
        setAddQuery("");
        toast({
          title: "Member added",
          description: `${user.name} joined the group.`,
          variant: "success",
        });
      }
    } catch {
      setAddErrors((prev) => ({ ...prev, [user.id]: "Unexpected error" }));
      toast({
        title: "Could not add member",
        description: "Try again.",
        variant: "error",
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, [user.id]: false }));
    }
  };

  // ── Remove member ─────────────────────────────────────────────────────────
  const handleRemoveMember = (member: GroupMember) => {
    setConfirmDialog({
      title: `Remove ${member.user.name}?`,
      description: "They will be removed from the group.",
      confirmLabel: "Remove member",
      confirmVariant: "destructive",
      onConfirm: async () => {
        setActionLoading((prev) => ({ ...prev, [member.userId]: true }));
        try {
          const r = await removeGroupMember(groupRef.current.id, member.userId);
          if (!r.success) {
            setMemberErrors((prev) => ({
              ...prev,
              [member.userId]: r.error ?? "Failed",
            }));
            toast({
              title: "Could not remove member",
              description: r.error ?? "Try again.",
              variant: "error",
            });
          } else {
            onGroupUpdated({
              members: groupRef.current.members.filter(
                (m) => m.userId !== member.userId,
              ),
              memberCount: groupRef.current.memberCount - 1,
            });
            toast({
              title: "Member removed",
              description: `${member.user.name} was removed from the group.`,
              variant: "success",
            });
          }
        } catch {
          setMemberErrors((prev) => ({
            ...prev,
            [member.userId]: "Unexpected error",
          }));
          toast({
            title: "Could not remove member",
            description: "Try again.",
            variant: "error",
          });
        } finally {
          setActionLoading((prev) => ({ ...prev, [member.userId]: false }));
        }
      },
    });
  };

  // ── Promote ───────────────────────────────────────────────────────────────
  const handlePromote = (member: GroupMember) => {
    setConfirmDialog({
      title: `Make ${member.user.name} an admin?`,
      description: "They will get admin permissions in this group.",
      confirmLabel: "Make admin",
      confirmVariant: "default",
      onConfirm: async () => {
        setActionLoading((prev) => ({ ...prev, [member.userId]: true }));
        try {
          const r = await promoteToAdmin(groupRef.current.id, member.userId);
          if (!r.success) {
            setMemberErrors((prev) => ({
              ...prev,
              [member.userId]: r.error ?? "Failed",
            }));
            toast({
              title: "Could not promote member",
              description: r.error ?? "Try again.",
              variant: "error",
            });
          } else {
            onGroupUpdated({
              members: groupRef.current.members.map((m) =>
                m.userId === member.userId ? { ...m, role: "ADMIN" } : m,
              ),
            });
            toast({
              title: "Member promoted",
              description: `${member.user.name} is now an admin.`,
              variant: "success",
            });
          }
        } catch {
          setMemberErrors((prev) => ({
            ...prev,
            [member.userId]: "Unexpected error",
          }));
          toast({
            title: "Could not promote member",
            description: "Try again.",
            variant: "error",
          });
        } finally {
          setActionLoading((prev) => ({ ...prev, [member.userId]: false }));
        }
      },
    });
  };

  // ── Leave ─────────────────────────────────────────────────────────────────
  const handleLeave = () => {
    setConfirmDialog({
      title: "Leave this group?",
      description: "You will need to be invited again to rejoin.",
      confirmLabel: "Leave group",
      confirmVariant: "destructive",
      onConfirm: async () => {
        const userId = session?.user?.id;
        if (!userId) return;
        setIsLeaving(true);
        try {
          const r = await removeGroupMember(group.id, userId);
          if (r.success) {
            toast({
              title: "Left group",
              description: `You left ${group.name}.`,
              variant: "success",
            });
            onClose();
            router.push("/groups");
          } else {
            toast({
              title: "Could not leave group",
              description: r.error ?? "Try again.",
              variant: "error",
            });
          }
        } catch {
          toast({
            title: "Could not leave group",
            description: "Try again.",
            variant: "error",
          });
        } finally {
          setIsLeaving(false);
        }
      },
    });
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteGroup = () => {
    setConfirmDialog({
      title: "Permanently delete this group?",
      description: "This cannot be undone.",
      confirmLabel: "Delete group",
      confirmVariant: "destructive",
      onConfirm: async () => {
        setIsDeletingGroup(true);
        try {
          const r = await deleteGroup(group.id);
          if (r.success) {
            toast({
              title: "Group deleted",
              description: `${group.name} was deleted permanently.`,
              variant: "success",
            });
            onClose();
            router.push("/groups");
          } else {
            toast({
              title: "Could not delete group",
              description: r.error ?? "Try again.",
              variant: "error",
            });
          }
        } catch {
          toast({
            title: "Could not delete group",
            description: "Try again.",
            variant: "error",
          });
        } finally {
          setIsDeletingGroup(false);
        }
      },
    });
  };

  const displayAvatar = localAvatar ?? group.image;
  const initials = group.name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const navItems: { id: NavItem; label: string; icon: React.ReactNode }[] = [
    { id: "info", label: "Info", icon: <Info className="size-4" /> },
    { id: "members", label: "Members", icon: <Users className="size-4" /> },
    { id: "media", label: "Media", icon: <ImageIcon className="size-4" /> },
    { id: "files", label: "Files", icon: <FileText className="size-4" /> },
    { id: "links", label: "Links", icon: <LinkIcon className="size-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div
        className="w-full max-w-2xl rounded-2xl border border-(--color-border-tertiary) bg-(--color-background-primary) shadow-xl overflow-hidden flex"
        style={{ height: 600 }}
      >
        {/* Left nav */}
        <div className="w-48 shrink-0 border-r border-(--color-border-tertiary) bg-(--color-background-secondary) p-3 flex flex-col">
          <p className="text-xs font-semibold text-(--color-text-tertiary) uppercase tracking-wide px-2 mb-2">
            Group
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

          <div className="mt-auto flex flex-col gap-0.5 pt-3 border-t border-(--color-border-tertiary)">
            {session?.user?.id !== group.createdBy && (
              <button
                onClick={handleLeave}
                disabled={isLeaving}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-(--color-coral-600) hover:bg-(--color-coral-50) transition-colors"
              >
                {isLeaving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <LogOut className="size-4" />
                )}
                Leave
              </button>
            )}
            {isAdmin && group.createdBy === session?.user?.id && (
              <button
                onClick={handleDeleteGroup}
                disabled={isDeletingGroup}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-(--color-coral-600) hover:bg-(--color-coral-50) transition-colors"
              >
                {isDeletingGroup ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Delete
              </button>
            )}
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
            {/* ── Info tab ───────────────────────────────────────────────── */}
            {nav === "info" && (
              <div>
                {/* Avatar & name */}
                <div className="flex flex-col items-center px-6 py-8 border-b border-(--color-border-tertiary)">
                  <div className="relative">
                    <Avatar style={{ width: 80, height: 80 }}>
                      {displayAvatar && (
                        <AvatarImage src={displayAvatar} alt={group.name} />
                      )}
                      <AvatarFallback className="bg-(--color-brand-50) text-2xl font-semibold text-(--color-brand-900)">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {isAdmin && (
                      <>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarChange}
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingAvatar}
                          className="absolute -bottom-1 -right-1 rounded-full bg-(--color-brand-400) p-1.5 text-white shadow hover:bg-(--color-brand-600) transition-colors"
                        >
                          {isUploadingAvatar ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Upload className="size-3.5" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                  {avatarError && (
                    <p className="mt-2 text-xs text-(--color-coral-400)">
                      {avatarError}
                    </p>
                  )}

                  {isAdmin && isEditingName ? (
                    <div className="mt-4 flex flex-col items-center gap-1 w-full max-w-xs">
                      <input
                        autoFocus
                        value={nameValue}
                        onChange={(e) => setNameValue(e.target.value)}
                        className="w-full rounded-md border border-(--color-border-secondary) bg-transparent px-3 py-1.5 text-center text-lg font-semibold text-(--color-text-primary) focus:outline-none focus:border-(--color-brand-400)"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSaveName}
                          disabled={isSavingName}
                          className="text-sm text-(--color-brand-400) font-medium"
                        >
                          {isSavingName ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Check className="size-4" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingName(false);
                            setNameValue(group.name);
                            setNameError("");
                          }}
                          className="text-sm text-(--color-text-tertiary)"
                        >
                          Cancel
                        </button>
                      </div>
                      {nameError && (
                        <p className="text-xs text-(--color-coral-400)">
                          {nameError}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-(--color-text-primary)">
                        {group.name}
                      </h3>
                      {isAdmin && (
                        <button
                          onClick={() => {
                            setIsEditingName(true);
                            setNameValue(group.name);
                          }}
                          className="text-(--color-text-tertiary) hover:text-(--color-text-primary) transition-colors"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  <p className="text-sm text-(--color-text-tertiary) mt-1">
                    Group · {group.memberCount} members
                  </p>
                </div>

                {/* Description */}
                <div className="mt-3 w-full px-4">
                  {isEditingDesc ? (
                    <div className="flex flex-col gap-1">
                      <textarea
                        autoFocus
                        value={descValue}
                        onChange={(e) => setDescValue(e.target.value)}
                        rows={3}
                        className="w-full rounded-md border border-(--color-border-secondary) bg-transparent px-3 py-2 text-sm text-(--color-text-primary) focus:outline-none focus:border-(--color-brand-400) resize-none"
                      />
                      {descError && (
                        <p className="text-xs text-(--color-coral-400)">
                          {descError}
                        </p>
                      )}
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={handleSaveDesc}
                          disabled={isSavingDesc}
                          className="text-sm text-(--color-brand-400) font-medium"
                        >
                          {isSavingDesc ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            "Save"
                          )}
                        </button>
                        <button
                          onClick={() => setIsEditingDesc(false)}
                          className="text-sm text-(--color-text-tertiary)"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-1 justify-center">
                      <p className="text-center text-sm text-(--color-text-secondary) leading-relaxed">
                        {group.description ||
                          (isAdmin
                            ? "Add a description..."
                            : "No description")}
                      </p>
                      {isAdmin && (
                        <button
                          onClick={() => setIsEditingDesc(true)}
                          className="shrink-0 text-(--color-text-tertiary) hover:text-(--color-text-primary) mt-0.5"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Settings rows */}
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
                  {onClearChat ? (
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
                  ) : null}
                </div>

                {/* Created by / date */}
                <div className="px-5 py-4 border-t border-(--color-border-tertiary)">
                  <p className="text-xs font-medium text-(--color-text-tertiary) uppercase tracking-wide mb-2">
                    Created by
                  </p>
                  <p className="text-sm font-medium text-(--color-text-primary)">
                    {group.creator.name}
                  </p>
                  <p className="text-xs text-(--color-text-secondary)">
                    @{group.creator.username}
                  </p>
                  <p className="mt-1 text-xs text-(--color-text-tertiary)">
                    {formatDate(group.createdAt)}
                  </p>
                </div>
              </div>
            )}

            {/* ── Members tab ─────────────────────────────────────────────── */}
            {nav === "members" && (
              <div className="p-4 space-y-4">
                {/* Search existing members */}
                <div>
                  <p className="text-xs font-medium text-(--color-text-tertiary) uppercase tracking-wide mb-2">
                    Search members
                  </p>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-(--color-text-tertiary)" />
                    <input
                      type="text"
                      placeholder="Filter members..."
                      value={filterQuery}
                      onChange={(e) => setFilterQuery(e.target.value)}
                      className="w-full rounded-lg border border-(--color-border-secondary) bg-transparent pl-9 pr-3 py-2 text-sm text-(--color-text-primary) placeholder:text-(--color-text-tertiary) focus:outline-none focus:border-(--color-brand-400)"
                    />
                  </div>
                </div>

                {/* Member list */}
                <div>
                  <p className="text-xs font-medium text-(--color-text-tertiary) uppercase tracking-wide mb-2">
                    {filteredMembers.length} of {group.memberCount} members
                  </p>
                  <div className="space-y-1">
                    {filteredMembers.map((member) => {
                      const mi = member.user.name
                        .split(" ")
                        .map((s) => s[0])
                        .filter(Boolean)
                        .slice(0, 2)
                        .join("")
                        .toUpperCase();
                      const isCreator = member.userId === group.createdBy;
                      const isCurrentUser = member.userId === session?.user?.id;
                      const error = memberErrors[member.userId];
                      const loading = actionLoading[member.userId];

                      return (
                        <div
                          key={member.id}
                          className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-(--color-background-secondary)"
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
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-xs font-medium text-(--color-text-primary) truncate">
                                {member.user.name} {" "}
                                {isCurrentUser && (
                                  <span className="text-(--color-text-tertiary)">(you)</span>
                                )}
                              </p>
                              {member.role === "ADMIN" && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1 py-0 border-(--color-brand-200) text-(--color-brand-600)"
                                >
                                  Admin
                                </Badge>
                              )}
                              {isCreator && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1 py-0 border-(--color-text-tertiary) text-(--color-text-tertiary)"
                                >
                                  Creator
                                </Badge>
                              )}
                            </div>
                            {error && (
                              <p className="text-[10px] text-(--color-coral-400)">
                                {error}
                              </p>
                            )}
                          </div>
                          {isAdmin && !isCreator && !isCurrentUser && (
                            <div className="flex items-center gap-2 shrink-0">
                              {member.role !== "ADMIN" && (
                                <button
                                  onClick={() => handlePromote(member)}
                                  disabled={loading}
                                  className="text-xs text-(--color-brand-400) hover:underline disabled:opacity-50"
                                >
                                  {loading ? (
                                    <Loader2 className="size-3 animate-spin" />
                                  ) : (
                                    "Make admin"
                                  )}
                                </button>
                              )}
                              <button
                                onClick={() => handleRemoveMember(member)}
                                disabled={loading}
                                className="text-xs text-(--color-coral-600) hover:underline disabled:opacity-50"
                              >
                                {loading ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  "Remove"
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Add new members */}
                <div className="border-t border-(--color-border-tertiary) pt-4">
                  <p className="text-xs font-medium text-(--color-text-tertiary) uppercase tracking-wide mb-2">
                    Add people
                  </p>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-(--color-text-tertiary)" />
                    <input
                      type="text"
                      placeholder="Search by name or username..."
                      value={addQuery}
                      onChange={(e) => setAddQuery(e.target.value)}
                      className="w-full rounded-lg border border-(--color-border-secondary) bg-transparent pl-9 pr-3 py-2 text-sm text-(--color-text-primary) placeholder:text-(--color-text-tertiary) focus:outline-none focus:border-(--color-brand-400)"
                    />
                  </div>

                  {(isAddSearching || addResults.length > 0) && (
                    <div className="mt-1 rounded-xl border border-(--color-border-tertiary) overflow-hidden">
                      {isAddSearching ? (
                        <div className="flex justify-center py-3">
                          <Loader2 className="size-4 animate-spin text-(--color-text-tertiary)" />
                        </div>
                      ) : (
                        addResults.map((user) => {
                          const ui = user.name
                            .split(" ")
                            .map((s) => s[0])
                            .filter(Boolean)
                            .slice(0, 2)
                            .join("")
                            .toUpperCase();
                          const addError = addErrors[user.id];
                          return (
                            <div
                              key={user.id}
                              className="flex flex-col px-3 py-2 hover:bg-(--color-background-secondary)"
                            >
                              <div className="flex items-center gap-2">
                                <Avatar size="sm">
                                  {user.image && (
                                    <AvatarImage src={user.image} alt={user.name} />
                                  )}
                                  <AvatarFallback className="text-[10px] bg-(--color-brand-50) text-(--color-brand-900)">
                                    {ui}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-(--color-text-primary) truncate">
                                    {user.name}
                                  </p>
                                  <p className="text-[10px] text-(--color-text-tertiary)">
                                    @{user.username}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleAddMember(user)}
                                  disabled={actionLoading[user.id]}
                                  className="text-xs text-(--color-brand-400) hover:underline shrink-0 disabled:opacity-50"
                                >
                                  {actionLoading[user.id] ? (
                                    <Loader2 className="size-3 animate-spin" />
                                  ) : (
                                    "Add"
                                  )}
                                </button>
                              </div>
                              {addError && (
                                <p className="mt-0.5 text-[10px] text-(--color-coral-400) pl-8">
                                  {addError}
                                </p>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
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
        isLoading={isClearing || isLeaving || isDeletingGroup}
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
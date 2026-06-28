"use client";

import { useEffect, useRef, useState } from "react";
import {
  X,
  Info,
  Image as ImageIcon,
  FileText,
  Users,
  Loader2,
  LogOut,
  Trash2,
  UserPlus,
  Shield,
  UserMinus,
  Upload,
  Pencil,
  Check,
  Search,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { GroupDetail, GroupMember } from "@/types";
import {
  getSharedMedia,
  getSharedFiles,
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
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useDebounce } from "@/hooks/useDebounce";

type SharedMedia = { id: string; imageUrl: string; createdAt: Date };
type SharedFile = {
  id: string;
  fileUrl: string;
  fileName: string;
  fileSize: number | null;
  createdAt: Date;
};

type UserResult = {
  id: string;
  name: string;
  username: string;
  image: string | null;
};

type NavItem = "info" | "members" | "media" | "files";

type GroupInfoModalProps = {
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

export default function GroupInfoModal({
  group,
  onClose,
  onGroupUpdated,
}: GroupInfoModalProps) {
  const [nav, setNav] = useState<NavItem>("info");
  const [media, setMedia] = useState<SharedMedia[]>([]);
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // Member actions
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {},
  );
  const [memberErrors, setMemberErrors] = useState<Record<string, string>>({});

  // Add member search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});
  const debouncedQuery = useDebounce(searchQuery, 400);

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

  // Leave / delete
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const { data: session } = useSession();
  const router = useRouter();
  const isAdmin = group.currentUserRole === "ADMIN";
  const groupRef = useRef(group);

  useEffect(() => {
    groupRef.current = group;
  }, [group]);

  // Load media/files on nav change
  useEffect(() => {
    const load = async () => {
      if (nav === "media" && media.length === 0) {
        setIsLoadingMedia(true);
        const result = await getSharedMedia(group.id);
        if (result.success) setMedia(result.data);
        setIsLoadingMedia(false);
      }
      if (nav === "files" && files.length === 0) {
        setIsLoadingFiles(true);
        const result = await getSharedFiles(group.id);
        if (result.success) setFiles(result.data);
        setIsLoadingFiles(false);
      }
    };
    load();
  }, [nav]);

  // Search users when query changes
  useEffect(() => {
    const search = async () => {
      if (!debouncedQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      const result = await searchUsersForGroup(debouncedQuery, group.id);
      if (result.success) setSearchResults(result.data);
      setIsSearching(false);
    };
    search();
  }, [debouncedQuery]);

  // ── Avatar ────────────────────────────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError("");
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const result = await uploadGroupAvatar(group.id, formData);
      if (!result.success) {
        setAvatarError(result.error ?? "Upload failed");
      } else {
        setLocalAvatar(result.imageUrl);
        onGroupUpdated({ image: result.imageUrl });
      }
    } catch {
      setAvatarError("Upload failed");
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
      const result = await updateGroup(group.id, { name: nameValue.trim() });
      if (!result.success) {
        setNameError(result.error ?? "Failed to update name");
      } else {
        onGroupUpdated({ name: nameValue.trim() });
        setIsEditingName(false);
      }
    } catch {
      setNameError("Failed to update name");
    } finally {
      setIsSavingName(false);
    }
  };

  // ── Description ───────────────────────────────────────────────────────────
  const handleSaveDesc = async () => {
    setIsSavingDesc(true);
    setDescError("");
    try {
      const result = await updateGroup(group.id, {
        description: descValue.trim(),
      });
      if (!result.success) {
        setDescError(result.error ?? "Failed to update description");
      } else {
        onGroupUpdated({ description: descValue.trim() });
        setIsEditingDesc(false);
      }
    } catch {
      setDescError("Failed to update description");
    } finally {
      setIsSavingDesc(false);
    }
  };

  // ── Add member ────────────────────────────────────────────────────────────
  const handleAddMember = async (user: UserResult) => {
    setActionLoading((prev) => ({ ...prev, [user.id]: true }));
    try {
      const result = await addGroupMember(groupRef.current.id, user.id);
      if (!result.success) {
        setAddErrors((prev) => ({
          ...prev,
          [user.id]: result.error ?? "Failed",
        }));
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
        setSearchResults((prev) => prev.filter((u) => u.id !== user.id));
        setSearchQuery("");
      }
    } catch {
      setAddErrors((prev) => ({ ...prev, [user.id]: "Unexpected error" }));
    } finally {
      setActionLoading((prev) => ({ ...prev, [user.id]: false }));
    }
  };

  // ── Remove member ─────────────────────────────────────────────────────────
  const handleRemoveMember = async (member: GroupMember) => {
    if (!confirm(`Remove ${member.user.name} from the group?`)) return;
    setActionLoading((prev) => ({ ...prev, [member.userId]: true }));
    try {
      const result = await removeGroupMember(
        groupRef.current.id,
        member.userId,
      );
      if (!result.success) {
        setMemberErrors((prev) => ({
          ...prev,
          [member.userId]: result.error ?? "Failed",
        }));
      } else {
        onGroupUpdated({
          members: groupRef.current.members.filter(
            (m) => m.userId !== member.userId,
          ),
          memberCount: groupRef.current.memberCount - 1,
        });
      }
    } catch {
      setMemberErrors((prev) => ({
        ...prev,
        [member.userId]: "Unexpected error",
      }));
    } finally {
      setActionLoading((prev) => ({ ...prev, [member.userId]: false }));
    }
  };

  // ── Promote ───────────────────────────────────────────────────────────────
  const handlePromote = async (member: GroupMember) => {
    if (!confirm(`Make ${member.user.name} an admin?`)) return;
    setActionLoading((prev) => ({ ...prev, [member.userId]: true }));
    try {
      const result = await promoteToAdmin(groupRef.current.id, member.userId);
      if (!result.success) {
        setMemberErrors((prev) => ({
          ...prev,
          [member.userId]: result.error ?? "Failed",
        }));
      } else {
        onGroupUpdated({
          members: groupRef.current.members.map((m) =>
            m.userId === member.userId ? { ...m, role: "ADMIN" } : m,
          ),
        });
      }
    } catch {
      setMemberErrors((prev) => ({
        ...prev,
        [member.userId]: "Unexpected error",
      }));
    } finally {
      setActionLoading((prev) => ({ ...prev, [member.userId]: false }));
    }
  };

  // ── Leave ─────────────────────────────────────────────────────────────────
  const handleLeave = async () => {
    if (!confirm("Leave this group?")) return;
    const userId = session?.user?.id;
    if (!userId) return;
    setIsLeaving(true);
    try {
      const result = await removeGroupMember(group.id, userId);
      if (result.success) {
        onClose();
        router.push("/groups");
      }
    } finally {
      setIsLeaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteGroup = async () => {
    if (!confirm("Permanently delete this group? This cannot be undone."))
      return;
    setIsDeletingGroup(true);
    try {
      const result = await deleteGroup(group.id);
      if (result.success) {
        onClose();
        router.push("/groups");
      }
    } finally {
      setIsDeletingGroup(false);
    }
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
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div
        className="w-full max-w-2xl rounded-2xl border border-(--color-border-tertiary) bg-(--color-background-primary) shadow-xl overflow-hidden flex"
        style={{ height: 560 }}
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

          {/* Leave / delete at bottom of nav */}
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
            {/* Info tab */}
            {nav === "info" && (
              <div className="flex flex-col items-center px-6 py-8">
                <div className="relative">
                  <Avatar style={{ width: 80, height: 80 }}>
                    {displayAvatar && (
                      <AvatarImage src={displayAvatar} alt={group.name} />
                    )}
                    <AvatarFallback className="bg-(--color-background-tertiary) text-2xl font-semibold text-(--color-text-secondary)">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {isAdmin && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-(--color-brand-400) text-white shadow-sm hover:bg-(--color-brand-600) transition-colors"
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
                  <p className="mt-1 text-xs text-(--color-coral-400)">
                    {avatarError}
                  </p>
                )}

                {/* Name */}
                <div className="mt-4 flex items-center gap-2 justify-center w-full px-8">
                  {isEditingName ? (
                    <div className="flex items-center gap-1 w-full">
                      <input
                        autoFocus
                        value={nameValue}
                        onChange={(e) => setNameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveName();
                          if (e.key === "Escape") setIsEditingName(false);
                        }}
                        className="flex-1 rounded-md border border-(--color-border-secondary) bg-transparent px-3 py-1.5 text-base text-(--color-text-primary) focus:outline-none focus:border-(--color-brand-400)"
                      />
                      <button
                        onClick={handleSaveName}
                        disabled={isSavingName}
                        className="shrink-0 text-(--color-brand-400)"
                      >
                        {isSavingName ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Check className="size-4" />
                        )}
                      </button>
                      <button
                        onClick={() => setIsEditingName(false)}
                        className="shrink-0 text-(--color-text-tertiary)"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-(--color-text-primary)">
                        {group.name}
                      </h3>
                      {isAdmin && (
                        <button
                          onClick={() => setIsEditingName(true)}
                          className="text-(--color-text-tertiary) hover:text-(--color-text-primary)"
                        >
                          <Pencil className="size-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
                {nameError && (
                  <p className="text-xs text-(--color-coral-400) mt-1">
                    {nameError}
                  </p>
                )}

                <p className="text-sm text-(--color-text-tertiary) mt-1">
                  Group · {group.memberCount} members
                </p>

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
                          (isAdmin ? "Add a description..." : "No description")}
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
              </div>
            )}

            {/* Members tab */}
            {nav === "members" && (
              <div className="p-4">
                {/* Search to add */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-(--color-text-tertiary)" />
                    <input
                      type="text"
                      placeholder="Search by name or username to add..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-lg border border-(--color-border-secondary) bg-transparent pl-9 pr-3 py-2 text-sm text-(--color-text-primary) placeholder:text-(--color-text-tertiary) focus:outline-none focus:border-(--color-brand-400)"
                    />
                  </div>

                  {/* Search results */}
                  {(isSearching || searchResults.length > 0) && (
                    <div className="mt-1 rounded-xl border border-(--color-border-tertiary) overflow-hidden">
                      {isSearching ? (
                        <div className="flex justify-center py-3">
                          <Loader2 className="size-4 animate-spin text-(--color-text-tertiary)" />
                        </div>
                      ) : (
                        searchResults.map((user) => {
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
                                    <AvatarImage
                                      src={user.image}
                                      alt={user.name}
                                    />
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
                                  className="flex items-center gap-1 text-xs text-(--color-brand-400) hover:underline shrink-0"
                                >
                                  {actionLoading[user.id] ? (
                                    <Loader2 className="size-3 animate-spin" />
                                  ) : (
                                    <UserPlus className="size-3" />
                                  )}
                                  Add
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

                {/* Member list */}
                <p className="text-xs font-medium text-(--color-text-tertiary) uppercase tracking-wide mb-2">
                  {group.memberCount} members
                </p>
                <div className="space-y-1">
                  {group.members.map((member) => {
                    const mi = member.user.name
                      .split(" ")
                      .map((s) => s[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();
                    const isCreator = member.userId === group.createdBy;
                    const error = memberErrors[member.userId];
                    const isCurrentUser = member.userId === session?.user?.id;

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
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-medium text-(--color-text-primary) truncate">
                              {member.user.name}{" "}
                              {isCurrentUser && (
                                <span className="text-(--color-text-tertiary)">
                                  (you)
                                </span>
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
                          <div className="flex items-center gap-1 shrink-0">
                            {member.role !== "ADMIN" && (
                              <button
                                onClick={() => handlePromote(member)}
                                disabled={actionLoading[member.userId]}
                                className="rounded p-1 text-(--color-text-tertiary) hover:bg-(--color-background-tertiary) transition-colors"
                                title="Make admin"
                              >
                                {actionLoading[member.userId] ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  <Shield className="size-3" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => handleRemoveMember(member)}
                              disabled={actionLoading[member.userId]}
                              className="rounded p-1 text-(--color-text-tertiary) hover:bg-(--color-coral-50) hover:text-(--color-coral-600) transition-colors"
                              title="Remove member"
                            >
                              <UserMinus className="size-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Media tab */}
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

            {/* Files tab */}
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
    </div>
  );
}

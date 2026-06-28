"use client";

import { useEffect, useRef, useState } from "react";
import {
  X,
  Loader2,
  UserPlus,
  Shield,
  UserMinus,
  ChevronDown,
  ChevronUp,
  Upload,
  Pencil,
  Check,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { GroupDetail, GroupMember, Friend } from "@/types";
import {
  addGroupMember,
  removeGroupMember,
  promoteToAdmin,
} from "@/app/actions/groups/members";
import { updateGroup, uploadGroupAvatar } from "@/app/actions/groups/update";
import { getFriends } from "@/app/actions/friends/list";
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

type Tab = "members" | "media" | "files";

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

export default function GroupSettingsPanel({
  group,
  onClose,
  onGroupUpdated,
}: GroupSettingsPanelProps) {
  const [tab, setTab] = useState<Tab>("members");
  const [showAddMember, setShowAddMember] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {},
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Edit group info
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [nameValue, setNameValue] = useState(group.name);
  const [descValue, setDescValue] = useState(group.description ?? "");
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingDesc, setIsSavingDesc] = useState(false);
  const [nameError, setNameError] = useState("");
  const [descError, setDescError] = useState("");

  // Avatar upload
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Media / files
  const [media, setMedia] = useState<SharedMedia[]>([]);
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // Delete group
  // const [isDeletingGroup, setIsDeletingGroup] = useState(false);

  const [friendErrors, setFriendErrors] = useState<Record<string, string>>({});
  const [friendListError, setFriendListError] = useState("");

  const isAdmin = group.currentUserRole === "ADMIN";

  const groupRef = useRef(group);
  useEffect(() => {
    groupRef.current = group;
  }, [group]);

  // Load media when tab changes
  useEffect(() => {
    const loadMedia = async () => {
      if (tab === "media" && media.length === 0) {
        setIsLoadingMedia(true);
        const result = await getSharedMedia(group.id);
        if (result.success) setMedia(result.data);
        setIsLoadingMedia(false);
      }
    };

    const loadFiles = async () => {
      if (tab === "files" && files.length === 0) {
        setIsLoadingFiles(true);
        const result = await getSharedFiles(group.id);
        if (result.success) setFiles(result.data);
        setIsLoadingFiles(false);
      }
    };

    loadMedia();
    loadFiles();
  }, [tab, files.length, group.id, media.length]);

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
      setAvatarError("Upload failed unexpectedly");
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
    const description = descValue.trim();
    try {
      const result = await updateGroup(group.id, { description });
      if (!result.success) {
        setDescError(result.error ?? "Failed to update description");
      } else {
        setDescValue(description);
        onGroupUpdated({ description });
        setIsEditingDesc(false);
      }
    } catch {
      setDescError("Failed to update description");
    } finally {
      setIsSavingDesc(false);
    }
  };

  // ── Members ───────────────────────────────────────────────────────────────
  const handleShowAddMember = async () => {
    if (showAddMember) {
      setShowAddMember(false);
      return;
    }
    setIsLoadingFriends(true);
    setShowAddMember(true);
    setFriendListError("");
    try {
      const result = await getFriends();
      if (result.success) {
        const memberIds = new Set(
          groupRef.current.members.map((m) => m.userId),
        );
        setFriends(result.data.filter((f) => !memberIds.has(f.id)));
      } else {
        setFriendListError(result.error ?? "Failed to load friends");
      }
    } catch {
      setFriendListError("Failed to load friends");
    } finally {
      setIsLoadingFriends(false);
    }
  };

  const handleAddMember = async (friendId: string) => {
    setActionLoading((prev) => ({ ...prev, [friendId]: true }));
    try {
      const result = await addGroupMember(groupRef.current.id, friendId);
      if (!result.success) {
        setFriendErrors((prev) => ({
          ...prev,
          [friendId]: result.error ?? "Failed",
        }));
      } else {
        const friend = friends.find((f) => f.id === friendId);
        if (friend) {
          const newMember: GroupMember = {
            id: `new-${friend.id}`,
            userId: friend.id,
            role: "MEMBER",
            joinedAt: new Date(),
            user: {
              id: friend.id,
              name: friend.name,
              username: friend.username,
              image: friend.image,
            },
          };
          onGroupUpdated({
            members: [...groupRef.current.members, newMember],
            memberCount: groupRef.current.memberCount + 1,
          });
        } else {
          onGroupUpdated({ memberCount: groupRef.current.memberCount + 1 });
        }
        setFriends((prev) => prev.filter((f) => f.id !== friendId));
      }
    } catch {
      setFriendErrors((prev) => ({
        ...prev,
        [friendId]: "An unexpected error occurred",
      }));
    } finally {
      setActionLoading((prev) => ({ ...prev, [friendId]: false }));
    }
  };

  const handleRemoveMember = async (member: GroupMember) => {
    if (!confirm(`Remove ${member.user.name} from the group?`)) return;
    setActionLoading((prev) => ({ ...prev, [member.userId]: true }));
    try {
      const result = await removeGroupMember(
        groupRef.current.id,
        member.userId,
      );
      if (!result.success) {
        setErrors((prev) => ({
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
      setErrors((prev) => ({
        ...prev,
        [member.userId]: "An unexpected error occurred",
      }));
    } finally {
      setActionLoading((prev) => ({ ...prev, [member.userId]: false }));
    }
  };

  const handlePromote = async (member: GroupMember) => {
    if (!confirm(`Make ${member.user.name} an admin?`)) return;
    setActionLoading((prev) => ({ ...prev, [member.userId]: true }));
    try {
      const result = await promoteToAdmin(groupRef.current.id, member.userId);
      if (!result.success) {
        setErrors((prev) => ({
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
      setErrors((prev) => ({
        ...prev,
        [member.userId]: "An unexpected error occurred",
      }));
    } finally {
      setActionLoading((prev) => ({ ...prev, [member.userId]: false }));
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

  return (
    <div className="flex h-full w-72 shrink-0 flex-col border-l border-(--color-border-tertiary) bg-(--color-background-primary)">
      {/* Header */}
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
        {/* Group profile */}
        <div className="flex flex-col items-center px-4 py-6 border-b border-(--color-border-tertiary)">
          <div className="relative">
            <Avatar size="lg" style={{ width: 72, height: 72 }}>
              {displayAvatar && (
                <AvatarImage src={displayAvatar} alt={group.name} />
              )}
              <AvatarFallback className="bg-(--color-background-tertiary) text-xl font-semibold text-(--color-text-secondary)">
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
                  className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-(--color-brand-400) text-white shadow-sm hover:bg-(--color-brand-600) transition-colors"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Upload className="size-3" />
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
          <div className="mt-3 flex items-center gap-1.5 w-full justify-center">
            {isEditingName ? (
              <div className="flex items-center gap-1 w-full px-4">
                <input
                  autoFocus
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") setIsEditingName(false);
                  }}
                  className="flex-1 rounded-md border border-(--color-border-secondary) bg-transparent px-2 py-1 text-sm text-(--color-text-primary) focus:outline-none focus:border-(--color-brand-400)"
                />
                <button
                  onClick={handleSaveName}
                  disabled={isSavingName}
                  className="shrink-0 text-(--color-brand-400)"
                >
                  {isSavingName ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Check className="size-3.5" />
                  )}
                </button>
                <button
                  onClick={() => setIsEditingName(false)}
                  className="shrink-0 text-(--color-text-tertiary)"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-base font-semibold text-(--color-text-primary)">
                  {group.name}
                </h2>
                {isAdmin && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-(--color-text-tertiary) hover:text-(--color-text-primary)"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                )}
              </>
            )}
          </div>
          {nameError && (
            <p className="text-xs text-(--color-coral-400)">{nameError}</p>
          )}

          <p className="text-xs text-(--color-text-tertiary)">
            {group.memberCount} members
          </p>

          {/* Description */}
          <div className="mt-2 w-full px-2">
            {isEditingDesc ? (
              <div className="flex flex-col gap-1">
                <textarea
                  autoFocus
                  value={descValue}
                  onChange={(e) => setDescValue(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-(--color-border-secondary) bg-transparent px-2 py-1 text-xs text-(--color-text-primary) focus:outline-none focus:border-(--color-brand-400) resize-none"
                />
                {descError && (
                  <p className="text-xs text-(--color-coral-400)">
                    {descError}
                  </p>
                )}
                <div className="flex justify-end gap-1">
                  <button
                    onClick={handleSaveDesc}
                    disabled={isSavingDesc}
                    className="text-xs text-(--color-brand-400) font-medium"
                  >
                    {isSavingDesc ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </button>
                  <button
                    onClick={() => setIsEditingDesc(false)}
                    className="text-xs text-(--color-text-tertiary)"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-1 justify-center">
                <p className="text-center text-xs text-(--color-text-secondary) leading-relaxed">
                  {group.description ||
                    (isAdmin ? "Add a description..." : "No description")}
                </p>
                {isAdmin && (
                  <button
                    onClick={() => setIsEditingDesc(true)}
                    className="shrink-0 text-(--color-text-tertiary) hover:text-(--color-text-primary) mt-0.5"
                  >
                    <Pencil className="size-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-(--color-border-tertiary)">
          <div className="flex">
            {(["members", "media", "files"] as Tab[]).map((t) => (
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

        {/* Members tab */}
        {tab === "members" && (
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-(--color-text-tertiary) uppercase tracking-wide">
                Members
              </p>
              {isAdmin && (
                <button
                  onClick={handleShowAddMember}
                  className="flex items-center gap-1 text-xs text-(--color-brand-400) hover:underline"
                >
                  <UserPlus className="size-3" />
                  Add
                  {showAddMember ? (
                    <ChevronUp className="size-3" />
                  ) : (
                    <ChevronDown className="size-3" />
                  )}
                </button>
              )}
            </div>

            {showAddMember && (
              <div className="mb-3 rounded-xl border border-(--color-border-tertiary) overflow-hidden">
                {isLoadingFriends ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="size-4 animate-spin text-(--color-text-tertiary)" />
                  </div>
                ) : friendListError ? (
                  <p className="text-xs text-(--color-coral-400) text-center py-3">
                    {friendListError}
                  </p>
                ) : friends.length === 0 ? (
                  <p className="text-xs text-(--color-text-tertiary) text-center py-3">
                    No friends to add
                  </p>
                ) : (
                  friends.map((friend) => {
                    const fi = friend.name
                      .split(" ")
                      .map((s) => s[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();
                    const friendError = friendErrors[friend.id];

                    return (
                      <div
                        key={friend.id}
                        className="flex flex-col px-3 py-2 hover:bg-(--color-background-secondary)"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar size="sm">
                            <AvatarFallback className="text-[10px] bg-(--color-brand-50) text-(--color-brand-900)">
                              {fi}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-(--color-text-primary) truncate">
                              {friend.name}
                            </p>
                          </div>
                          <button
                            onClick={() => handleAddMember(friend.id)}
                            disabled={actionLoading[friend.id]}
                            className="text-xs text-(--color-brand-400) hover:underline shrink-0"
                          >
                            {actionLoading[friend.id] ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              "Add"
                            )}
                          </button>
                        </div>
                        {friendError && (
                          <p className="mt-0.5 text-[10px] text-(--color-coral-400) pl-8">
                            {friendError}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

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
                const error = errors[member.userId];

                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 rounded-lg px-2 py-2"
                  >
                    <Avatar size="sm">
                      <AvatarFallback className="text-[10px] bg-(--color-brand-50) text-(--color-brand-900)">
                        {mi}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-medium text-(--color-text-primary) truncate">
                          {member.user.name}
                        </p>
                        {member.role === "ADMIN" && (
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1 py-0 border-(--color-brand-200) text-(--color-brand-600)"
                          >
                            Admin
                          </Badge>
                        )}
                      </div>
                      {error && (
                        <p className="text-[10px] text-(--color-coral-400)">
                          {error}
                        </p>
                      )}
                    </div>
                    {isAdmin && !isCreator && (
                      <div className="flex items-center gap-1 shrink-0">
                        {member.role !== "ADMIN" && (
                          <button
                            onClick={() => handlePromote(member)}
                            disabled={actionLoading[member.userId]}
                            className="rounded p-1 text-(--color-text-tertiary) hover:bg-(--color-background-secondary) transition-colors"
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

        {/* Files tab */}
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

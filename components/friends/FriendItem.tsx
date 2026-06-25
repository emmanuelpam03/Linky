"use client";

import React from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarBadge } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import type { Friend } from "@/types";
import { cn } from "@/lib/utils";

type FriendItemProps = {
  friend: Friend;
};

const FriendItem = ({ friend }: FriendItemProps) => {
  const { id, name, username, image } = friend;

  const initials = name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-(--color-background-secondary)">
      <div className="flex items-center gap-4">
        <Avatar size="lg">
          <AvatarFallback className="bg-(--color-brand-50) text-sm font-medium text-(--color-brand-900)">
            {initials}
          </AvatarFallback>
          <AvatarBadge className="size-2.5 bg-(--color-status-offline) ring-2 ring-(--color-background-primary)" />
        </Avatar>

        <div className="min-w-0">
          <div className="text-sm font-semibold leading-tight text-(--color-text-primary)">
            {name}
          </div>
          <div className="mt-0.5 truncate text-xs text-(--color-text-secondary)">
            @{username}
          </div>
        </div>
      </div>

      <Link
        href={`/chats/${id}`}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "gap-2 rounded-lg border-(--color-border-tertiary) bg-(--color-background-primary) text-(--color-text-primary) hover:bg-(--color-background-secondary)",
        )}
      >
        <MessageSquare className="size-4" />
        Message
      </Link>
    </div>
  );
};

export default FriendItem;

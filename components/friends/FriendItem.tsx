"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarBadge } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare } from "lucide-react";
import type { Friend } from "@/types";
import { getOrCreateDirectConversation } from "@/app/actions/conversations/getOrCreate";

type FriendItemProps = {
  friend: Friend;
};

const FriendItem = ({ friend }: FriendItemProps) => {
  const { id, name, username } = friend;
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const initials = name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleMessage = async () => {
    setIsLoading(true);
    try {
      const result = await getOrCreateDirectConversation(id);
      if (result.success && result.conversationId) {
        router.push(`/chats/${result.conversationId}`);
      } else {
        // TODO: surface error to the user (toast/inline message)
      }
    } finally {
      setIsLoading(false);
    }
  };

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

      <Button
        variant="outline"
        size="sm"
        className="gap-2 rounded-lg border-(--color-border-tertiary) bg-(--color-background-primary) text-(--color-text-primary) hover:bg-(--color-background-secondary)"
        disabled={isLoading}
        onClick={handleMessage}
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <MessageSquare className="size-4" />
        )}
        Message
      </Button>
    </div>
  );
};

export default FriendItem;

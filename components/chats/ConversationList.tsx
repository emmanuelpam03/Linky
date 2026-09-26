"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import ConversationItem from "./ConversationItem";
import { Loader2 } from "lucide-react";
import type { ConversationListItem } from "@/types";
import { getConversations } from "@/app/actions/conversations/list";
import { useAppRealtime } from "@/components/providers/AppRealtimeProvider";

export default function ConversationList() {
  const {
    typingByConversation,
    onlineUsersById,
    conversationRevision,
  } = useAppRealtime();
  const [query, setQuery] = useState("");
  const [conversations, setConversations] = useState<ConversationListItem[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const result = await getConversations();
      if (!active) return;
      if (result.success) setConversations(result.data);
      else setHasError(true);
      setIsLoading(false);
    };
    void load();
    return () => {
      active = false;
    };
  }, [conversationRevision]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.lastMessage?.toLowerCase().includes(q),
    );
  }, [query, conversations]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-(--color-border-tertiary) px-4 py-4">
        <h1 className="text-lg font-semibold text-(--color-text-primary)">
          Chats
        </h1>
        <p className="mt-1 text-sm text-(--color-text-secondary)">
          Search and open your conversations
        </p>
        <Input
          placeholder="Search conversations"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mt-3"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-(--color-text-tertiary)" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-(--color-text-tertiary)">
              {query ? `No results for "${query}"` : "No conversations yet"}
            </p>
          </div>
        ) : (
          filtered.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              typingUsers={Object.values(
                typingByConversation[conversation.id] ?? {},
              )}
              isOtherUserOnline={Boolean(
                conversation.otherUser &&
                  onlineUsersById[conversation.otherUser.id],
              )}
            />
          ))
        )}
      </div>
    </div>
  );
}

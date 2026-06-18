"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { mockConversations } from "@/lib/mock-conversations";
import ConversationItem from "./ConversationItem";

export default function ConversationList() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return mockConversations;
    return mockConversations.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-(--color-border-tertiary) px-4 py-4">
        <h1 className="text-lg font-semibold text-(--color-text-primary)">Chats</h1>
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
        {filtered.map((conversation) => (
          <ConversationItem key={conversation.id} conversation={conversation} />
        ))}
      </div>
    </div>
  );
}

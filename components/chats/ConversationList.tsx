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
        <h1 className="mb-3 text-lg font-semibold text-(--color-text-primary)">
          Chats
        </h1>
        <Input
          placeholder="Search conversations"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border-(--color-border-tertiary) bg-(--color-background-tertiary) text-(--color-text-primary) placeholder:text-(--color-text-tertiary)"
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

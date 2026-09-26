"use client";

import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { searchMessages } from "@/app/actions/messages/search";
import type { MessageItem } from "@/types";

type MessageSearchPanelProps = {
  conversationId: string;
  onSelectMessage: (message: MessageItem) => void;
};

export default function MessageSearchPanel({
  conversationId,
  onSelectMessage,
}: MessageSearchPanelProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MessageItem[]>([]);
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const search = async () => {
    if (!query.trim() || isSearching) return;
    setIsSearching(true);
    setError("");

    try {
      const result = await searchMessages(conversationId, query);
      if (!result.success) {
        setError(result.error ?? "Could not search this conversation.");
        setResults([]);
      } else {
        setResults(result.data);
      }
    } catch (caught) {
      console.error("Could not search conversation messages:", caught);
      setError("Could not search this conversation. Try again.");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <section className="border-b border-(--color-border-tertiary) bg-(--color-background-primary) p-4">
      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void search();
        }}
      >
        <input
          autoFocus
          value={query}
          maxLength={200}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search message history"
          aria-label="Search message history"
          className="min-w-0 flex-1 rounded-lg border border-(--color-border-secondary) bg-(--color-background-secondary) px-3 py-2 text-sm text-(--color-text-primary) outline-none focus:border-(--color-brand-400)"
        />
        <button
          type="submit"
          disabled={!query.trim() || isSearching}
          className="flex items-center gap-2 rounded-lg bg-(--color-brand-400) px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {isSearching ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Search className="size-4" />
          )}
          Search
        </button>
      </form>

      {error && <p className="mt-2 text-xs text-(--color-coral-500)">{error}</p>}
      {!error && results.length === 0 && query.trim() && !isSearching && (
        <p className="mt-3 text-xs text-(--color-text-tertiary)">
          No matching messages.
        </p>
      )}
      {results.length > 0 && (
        <ul className="mt-3 max-h-56 space-y-1 overflow-y-auto">
          {results.map((message) => (
            <li key={message.id}>
              <button
                type="button"
                onClick={() => onSelectMessage(message)}
                className="w-full rounded-lg px-3 py-2 text-left hover:bg-(--color-background-secondary)"
              >
                <span className="block text-xs font-medium text-(--color-text-secondary)">
                  {message.sender.name} ·{" "}
                  {new Intl.DateTimeFormat("en", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(message.createdAt))}
                </span>
                <span className="mt-1 block truncate text-sm text-(--color-text-primary)">
                  {message.text}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

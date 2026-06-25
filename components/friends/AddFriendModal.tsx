"use client";

import { useState, useEffect, useRef } from "react";
import { X, Search, UserPlus, Loader2, Check } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchUsers } from "@/app/actions/friends/search";
import { sendFriendRequest } from "@/app/actions/friends/request";
import type { UserResult } from "@/types";
import { useDebounce } from "@/hooks/useDebounce";

type AddFriendModalProps = {
  onClose: () => void;
};

type RequestState = "idle" | "loading" | "sent" | "error";

const AddFriendModal = ({ onClose }: AddFriendModalProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [requestStates, setRequestStates] = useState<
    Record<string, RequestState>
  >({});
  const [requestErrors, setRequestErrors] = useState<Record<string, string>>(
    {},
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 400);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Search on debounced query change
  useEffect(() => {
    const search = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      const result = await searchUsers(debouncedQuery);
      if (result.success) setResults(result.data);
      setIsSearching(false);
    };

    search();
  }, [debouncedQuery]);

  const handleSendRequest = async (userId: string) => {
    setRequestStates((prev) => ({ ...prev, [userId]: "loading" }));
    setRequestErrors((prev) => ({ ...prev, [userId]: "" }));

    const result = await sendFriendRequest(userId);

    if (!result.success) {
      setRequestStates((prev) => ({ ...prev, [userId]: "error" }));
      setRequestErrors((prev) => ({
        ...prev,
        [userId]: result.error ?? "Failed to send request",
      }));
      return;
    }

    setRequestStates((prev) => ({ ...prev, [userId]: "sent" }));
  };

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-md rounded-2xl bg-(--color-background-primary) border border-(--color-border-tertiary) shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-(--color-border-tertiary)">
          <div>
            <h2 className="text-base font-semibold text-(--color-text-primary)">
              Add friend
            </h2>
            <p className="text-xs text-(--color-text-secondary) mt-0.5">
              Search by name or username
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-(--color-text-tertiary) hover:bg-(--color-background-secondary) transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Search input */}
        <div className="px-5 py-4 border-b border-(--color-border-tertiary)">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-(--color-text-tertiary)" />
            <Input
              ref={inputRef}
              placeholder="Search people..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Results */}
        <div className="min-h-[200px] max-h-[320px] overflow-y-auto px-3 py-2">
          {isSearching && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-5 animate-spin text-(--color-text-tertiary)" />
            </div>
          )}

          {!isSearching && !debouncedQuery.trim() && (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Search className="size-8 text-(--color-text-tertiary)" />
              <p className="text-sm text-(--color-text-tertiary)">
                Start typing to search for people
              </p>
            </div>
          )}

          {!isSearching && debouncedQuery.trim() && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <p className="text-sm text-(--color-text-tertiary)">
                No users found for &quot;{debouncedQuery}&quot;
              </p>
            </div>
          )}

          {!isSearching &&
            results.map((user) => {
              const state = requestStates[user.id] ?? "idle";
              const error = requestErrors[user.id];

              const initials = user.name
                .split(" ")
                .map((s) => s[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-3 px-2 py-3 rounded-lg hover:bg-(--color-background-secondary) transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar size="default">
                      <AvatarFallback className="bg-(--color-brand-50) text-sm font-medium text-(--color-brand-900)">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-(--color-text-primary) truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-(--color-text-secondary) truncate">
                        @{user.username}
                      </p>
                      {error && (
                        <p className="text-xs text-(--color-coral-400) mt-0.5">
                          {error}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={state === "sent" ? "outline" : "brand"}
                    className="shrink-0 rounded-lg"
                    disabled={state === "loading" || state === "sent"}
                    onClick={() => handleSendRequest(user.id)}
                  >
                    {state === "loading" && (
                      <Loader2 className="size-4 animate-spin" />
                    )}
                    {state === "sent" && <Check className="size-4" />}
                    {state === "idle" && <UserPlus className="size-4" />}
                    {state === "error" && <UserPlus className="size-4" />}
                    {state === "loading"
                      ? "Sending..."
                      : state === "sent"
                        ? "Sent"
                        : "Add"}
                  </Button>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default AddFriendModal;

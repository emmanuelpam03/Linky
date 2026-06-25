"use client";

import React, { useEffect, useMemo, useState } from "react";
import FriendItem from "./FriendItem";
import AddFriendModal from "./AddFriendModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPlus, Loader2 } from "lucide-react";
import { getFriends } from "@/app/actions/friends/list";
import type { Friend } from "@/types";

const FriendList = () => {
  const [query, setQuery] = useState("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      const result = await getFriends();
      if (result.success) setFriends(result.data);
      setIsLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(
    () =>
      friends.filter(
        (f) =>
          f.name.toLowerCase().includes(query.trim().toLowerCase()) ||
          f.username.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [friends, query],
  );

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-(--color-background-primary)">
      <header className="flex items-center justify-between gap-4 border-b border-(--color-border-tertiary) px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-(--color-text-primary)">
            Friends
          </h1>
          <p className="mt-1 text-sm text-(--color-text-secondary)">
            Manage your contacts and start a conversation
          </p>
        </div>

        <div className="flex w-full max-w-xl flex-wrap items-center justify-end gap-2">
          <Input
            placeholder="Search friends"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-sm"
          />
          <Button
            variant="brand"
            size="sm"
            className="rounded-lg"
            onClick={() => setShowModal(true)}
          >
            <UserPlus className="size-4" />
            Add friend
          </Button>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-(--color-text-tertiary)" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <p className="text-sm text-(--color-text-tertiary)">
              {query
                ? `No friends matching "${query}"`
                : "You have no friends yet. Add some!"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-(--color-border-tertiary) rounded-xl border border-(--color-border-tertiary) bg-(--color-background-primary)">
            {filtered.map((f) => (
              <FriendItem key={f.id} friend={f} />
            ))}
          </div>
        )}
      </div>

      {showModal && <AddFriendModal onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default FriendList;

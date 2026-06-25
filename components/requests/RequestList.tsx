"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarBadge } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, X, Loader2 } from "lucide-react";
import {
  getIncomingRequests,
  getSentRequests,
} from "@/app/actions/friends/list";
import {
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
} from "@/app/actions/friends/request";
import type { FriendRequest } from "@/types";

type Tab = "incoming" | "sent";

const RequestList = () => {
  const [activeTab, setActiveTab] = useState<Tab>("incoming");
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [sent, setSent] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {},
  );
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const [incomingResult, sentResult] = await Promise.all([
        getIncomingRequests(),
        getSentRequests(),
      ]);
      if (incomingResult.success) setIncoming(incomingResult.data);
      if (sentResult.success) setSent(sentResult.data);
      setIsLoading(false);
    };
    load();
  }, []);

  const handleAccept = async (requestId: string) => {
    setActionLoading((prev) => ({ ...prev, [requestId]: true }));
    setActionErrors((prev) => ({ ...prev, [requestId]: "" }));

    const result = await acceptFriendRequest(requestId);

    if (!result.success) {
      setActionErrors((prev) => ({
        ...prev,
        [requestId]: result.error ?? "Failed to accept",
      }));
      setActionLoading((prev) => ({ ...prev, [requestId]: false }));
      return;
    }

    setIncoming((prev) => prev.filter((r) => r.id !== requestId));
    setActionLoading((prev) => ({ ...prev, [requestId]: false }));
  };

  const handleReject = async (requestId: string) => {
    setActionLoading((prev) => ({ ...prev, [requestId]: true }));
    setActionErrors((prev) => ({ ...prev, [requestId]: "" }));

    const result = await rejectFriendRequest(requestId);

    if (!result.success) {
      setActionErrors((prev) => ({
        ...prev,
        [requestId]: result.error ?? "Failed to reject",
      }));
      setActionLoading((prev) => ({ ...prev, [requestId]: false }));
      return;
    }

    setIncoming((prev) => prev.filter((r) => r.id !== requestId));
    setActionLoading((prev) => ({ ...prev, [requestId]: false }));
  };

  const handleCancel = async (requestId: string) => {
    setActionLoading((prev) => ({ ...prev, [requestId]: true }));
    setActionErrors((prev) => ({ ...prev, [requestId]: "" }));

    const result = await cancelFriendRequest(requestId);

    if (!result.success) {
      setActionErrors((prev) => ({
        ...prev,
        [requestId]: result.error ?? "Failed to cancel",
      }));
      setActionLoading((prev) => ({ ...prev, [requestId]: false }));
      return;
    }

    setSent((prev) => prev.filter((r) => r.id !== requestId));
    setActionLoading((prev) => ({ ...prev, [requestId]: false }));
  };

  const tabs = [
    { id: "incoming" as Tab, label: "Incoming", count: incoming.length },
    { id: "sent" as Tab, label: "Sent", count: sent.length },
  ];

  const requests = activeTab === "incoming" ? incoming : sent;

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-(--color-background-primary)">
      <header className="border-b border-(--color-border-tertiary) px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-(--color-text-primary)">
              Friend requests
            </h1>
            <p className="mt-1 text-sm text-(--color-text-secondary)">
              Review incoming requests or check what you have already sent
            </p>
          </div>

          <Badge
            variant="outline"
            className="border-(--color-border-tertiary) bg-(--color-background-secondary) text-(--color-text-secondary)"
          >
            {requests.length} visible
          </Badge>
        </div>

        <div className="mt-4 flex items-center gap-6 border-b border-(--color-border-tertiary)">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative -mb-px flex items-center gap-2 border-b-2 px-0 pb-3 text-sm font-medium transition-colors",
                  active
                    ? "border-(--color-brand-400) text-(--color-brand-600)"
                    : "border-transparent text-(--color-text-secondary) hover:text-(--color-text-primary)",
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                    active
                      ? "bg-(--color-brand-400) text-white"
                      : "bg-(--color-background-tertiary) text-(--color-text-secondary)",
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-(--color-text-tertiary)" />
          </div>
        ) : requests.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-(--color-text-tertiary)">
              {activeTab === "incoming"
                ? "No incoming requests"
                : "No sent requests"}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-(--color-border-tertiary) bg-(--color-background-primary)">
            {requests.map((request, index) => {
              const person =
                activeTab === "incoming" ? request.sender : request.receiver;
              const isActionLoading = actionLoading[request.id];
              const error = actionErrors[request.id];

              const initials = person.name
                .split(" ")
                .map((s) => s[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <div
                  key={request.id}
                  className={cn(
                    "flex items-center justify-between gap-4 px-5 py-4 border-b border-(--color-border-tertiary)",
                    index === requests.length - 1 && "border-b-0",
                  )}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <Avatar size="lg">
                      <AvatarFallback className="bg-(--color-brand-50) text-(--color-brand-900) text-sm font-medium">
                        {initials}
                      </AvatarFallback>
                      {activeTab === "incoming" && (
                        <AvatarBadge className="bg-(--color-brand-400) ring-(--color-background-primary)" />
                      )}
                    </Avatar>

                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-(--color-text-primary)">
                        {person.name}
                      </div>
                      <div className="text-xs text-(--color-text-secondary)">
                        @{person.username}
                      </div>
                      {error && (
                        <p className="text-xs text-(--color-coral-400) mt-0.5">
                          {error}
                        </p>
                      )}
                    </div>
                  </div>

                  {activeTab === "incoming" ? (
                    <div className="flex items-center gap-3 shrink-0">
                      <Button
                        variant="brand"
                        size="sm"
                        className="gap-2 rounded-lg"
                        disabled={isActionLoading}
                        onClick={() => handleAccept(request.id)}
                      >
                        {isActionLoading ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Check className="size-4" />
                        )}
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="size-9 rounded-lg border-(--color-border-secondary) bg-(--color-background-primary) p-0 text-(--color-text-secondary) hover:bg-(--color-background-secondary)"
                        disabled={isActionLoading}
                        onClick={() => handleReject(request.id)}
                        aria-label={`Decline ${person.name}`}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge
                        variant="outline"
                        className="border-(--color-border-tertiary) bg-(--color-background-secondary) text-(--color-text-secondary)"
                      >
                        Pending
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="size-9 rounded-lg border-(--color-border-secondary) bg-(--color-background-primary) p-0 text-(--color-text-secondary) hover:bg-(--color-background-secondary)"
                        disabled={isActionLoading}
                        onClick={() => handleCancel(request.id)}
                        aria-label={`Cancel request to ${person.name}`}
                      >
                        {isActionLoading ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <X className="size-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestList;

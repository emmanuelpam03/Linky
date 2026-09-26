"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { ReadReceiptEvent } from "./websocket";

type ReceiptState = {
  conversationId: string | undefined;
  lastReadAtByUser: Record<string, Date>;
};

export function useConversationReadReceipts(
  conversationId: string | undefined,
) {
  const [receiptState, setReceiptState] = useState<ReceiptState>({
    conversationId,
    lastReadAtByUser: {},
  });
  const activeConversationIdRef = useRef(conversationId);
  const lastReadAtByUser =
    receiptState.conversationId === conversationId
      ? receiptState.lastReadAtByUser
      : {};

  useLayoutEffect(() => {
    activeConversationIdRef.current = conversationId;
  }, [conversationId]);

  const handleReadReceiptEvent = useCallback(
    (event: ReadReceiptEvent) => {
      if (activeConversationIdRef.current !== conversationId) return;

      if (event.type === "read.snapshot") {
        const readers = Object.fromEntries(
          event.readers.map((reader) => [reader.userId, reader.lastReadAt]),
        );
        setReceiptState({ conversationId, lastReadAtByUser: readers });
        return;
      }

      setReceiptState((current) => ({
        conversationId,
        lastReadAtByUser: {
          ...(current.conversationId === conversationId
            ? current.lastReadAtByUser
            : {}),
          [event.userId]: event.lastReadAt,
        },
      }));
    },
    [conversationId],
  );

  return { lastReadAtByUser, handleReadReceiptEvent };
}

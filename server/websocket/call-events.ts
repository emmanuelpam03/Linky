import { WebSocket } from "ws";
import prisma from "../../lib/prisma";
import { getUserClients, sendJson, type ClientState } from "./connection-state";

type CallMediaType = "audio" | "video";
type CallSignal =
  | { kind: "description"; sdp: string; descriptionType: "offer" | "answer" }
  | {
      kind: "candidate";
      candidate: string;
      sdpMid: string | null;
      sdpMLineIndex: number | null;
    };

type Participant = {
  userId: string;
  name: string;
  sockets: Set<WebSocket>;
};

type ActiveCall = {
  conversationId: string;
  hostUserId: string;
  mediaType: CallMediaType;
  maxParticipants: number;
  participants: Map<string, Participant>;
};

const MAX_GROUP_PARTICIPANTS = 6;
const activeCalls = new Map<string, ActiveCall>();

async function getCallPermissions(conversationId: string, userId: string) {
  const membership = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
    select: {
      conversation: {
        select: {
          type: true,
          members: { select: { userId: true } },
        },
      },
    },
  });
  if (!membership) return null;
  if (membership.conversation.type === "GROUP") {
    return { type: "GROUP" as const, maxParticipants: MAX_GROUP_PARTICIPANTS };
  }

  const otherMember = membership.conversation.members.find(
    (member) => member.userId !== userId,
  );
  if (!otherMember) return null;

  const [friendship, block] = await Promise.all([
    prisma.friend.findFirst({
      where: { userId, friendId: otherMember.userId },
      select: { id: true },
    }),
    prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: otherMember.userId },
          { blockerId: otherMember.userId, blockedId: userId },
        ],
      },
      select: { id: true },
    }),
  ]);
  if (!friendship || block) return null;

  return { type: "DIRECT" as const, maxParticipants: 2 };
}

function getRoster(call: ActiveCall) {
  return Array.from(call.participants.values(), ({ userId, name }) => ({
    userId,
    name,
  }));
}

function broadcast(call: ActiveCall, event: unknown, except?: WebSocket) {
  for (const participant of call.participants.values()) {
    for (const socket of participant.sockets) {
      if (socket !== except) sendJson(socket, event);
    }
  }
}

export async function publishCallStatus(
  socket: WebSocket,
  state: ClientState,
  conversationId: string,
) {
  if (!(await getCallPermissions(conversationId, state.userId))) {
    sendJson(socket, { type: "error", code: "call_not_authorized" });
    return;
  }

  const call = activeCalls.get(conversationId);
  if (!call) {
    sendJson(socket, { type: "call.status", conversationId, active: false });
    return;
  }

  const participant = call.participants.get(state.userId);
  if (participant) participant.sockets.add(socket);
  sendJson(socket, {
    type: "call.status",
    conversationId,
    active: true,
    mediaType: call.mediaType,
    hostUserId: call.hostUserId,
    hostName: call.participants.get(call.hostUserId)?.name ?? "A participant",
    selfUserId: state.userId,
    selfJoined: Boolean(participant),
    participants: getRoster(call),
  });
}

export async function startConversationCall(
  socket: WebSocket,
  state: ClientState,
  conversationId: string,
  mediaType: CallMediaType,
) {
  const permissions = await getCallPermissions(conversationId, state.userId);
  if (!permissions) {
    sendJson(socket, { type: "error", code: "call_not_authorized" });
    return;
  }

  if (activeCalls.has(conversationId)) {
    sendJson(socket, { type: "error", code: "call_already_active" });
    return;
  }

  const call: ActiveCall = {
    conversationId,
    hostUserId: state.userId,
    mediaType,
    maxParticipants: permissions.maxParticipants,
    participants: new Map([
      [
        state.userId,
        { userId: state.userId, name: state.name, sockets: new Set([socket]) },
      ],
    ]),
  };
  activeCalls.set(conversationId, call);
  let members: { userId: string }[];
  try {
    members = await prisma.conversationMember.findMany({
      where: { conversationId, userId: { not: state.userId } },
      select: { userId: true },
    });
    await prisma.notification.createMany({
      data: members.map((member) => ({
        recipientId: member.userId,
        actorId: state.userId,
        type: "CALL_INVITE",
        title: "Incoming call",
        body: `${state.name} started a ${mediaType === "video" ? "video" : "voice"} call.`,
        href:
          permissions.type === "GROUP"
            ? `/groups/${conversationId}`
            : `/chats/${conversationId}`,
      })),
    });
  } catch (error) {
    if (activeCalls.get(conversationId) === call) {
      activeCalls.delete(conversationId);
    }
    throw error;
  }
  for (const member of members) {
    for (const recipient of getUserClients(member.userId)) {
      sendJson(recipient, {
        type: "call.invited",
        conversationId,
        hostUserId: state.userId,
        hostName: state.name,
        mediaType,
      });
    }
  }
  sendJson(socket, {
    type: "call.status",
    conversationId,
    active: true,
    mediaType,
    hostUserId: state.userId,
    hostName: state.name,
    selfUserId: state.userId,
    selfJoined: true,
    participants: getRoster(call),
  });
}

export async function joinConversationCall(
  socket: WebSocket,
  state: ClientState,
  conversationId: string,
) {
  if (!(await getCallPermissions(conversationId, state.userId))) {
    sendJson(socket, { type: "error", code: "call_not_authorized" });
    return;
  }

  const call = activeCalls.get(conversationId);
  if (!call) {
    sendJson(socket, { type: "error", code: "call_not_active" });
    return;
  }
  if (
    call.participants.size >= call.maxParticipants &&
    !call.participants.has(state.userId)
  ) {
    sendJson(socket, { type: "error", code: "call_full" });
    return;
  }

  let participant = call.participants.get(state.userId);
  const isNewParticipant = !participant;
  if (!participant) {
    participant = { userId: state.userId, name: state.name, sockets: new Set() };
    call.participants.set(state.userId, participant);
  }
  participant.sockets.add(socket);

  sendJson(socket, {
    type: "call.status",
    conversationId,
    active: true,
    mediaType: call.mediaType,
    hostUserId: call.hostUserId,
    hostName: call.participants.get(call.hostUserId)?.name ?? "A participant",
    selfUserId: state.userId,
    selfJoined: true,
    participants: getRoster(call),
  });
  if (isNewParticipant) {
    broadcast(
      call,
      {
        type: "call.peer.joined",
        conversationId,
        userId: state.userId,
        name: state.name,
      },
      socket,
    );
  }
}

export async function relayCallSignal(
  socket: WebSocket,
  state: ClientState,
  conversationId: string,
  peerUserId: string,
  signal: CallSignal,
) {
  const call = activeCalls.get(conversationId);
  const sender = call?.participants.get(state.userId);
  const peer = call?.participants.get(peerUserId);
  if (
    !call ||
    !sender?.sockets.has(socket) ||
    !peer ||
    !(await getCallPermissions(conversationId, state.userId))
  ) {
    sendJson(socket, { type: "error", code: "call_peer_unavailable" });
    return;
  }

  for (const recipient of peer.sockets) {
    sendJson(recipient, {
      type: "call.signal",
      conversationId,
      fromUserId: state.userId,
      signal,
    });
  }
}

export function leaveConversationCall(
  socket: WebSocket,
  state: ClientState,
  conversationId: string,
) {
  const call = activeCalls.get(conversationId);
  const participant = call?.participants.get(state.userId);
  if (!call || !participant) return;

  participant.sockets.delete(socket);
  if (participant.sockets.size > 0) return;

  call.participants.delete(state.userId);
  if (call.participants.size === 0) {
    activeCalls.delete(conversationId);
    return;
  }

  broadcast(call, {
    type: "call.peer.left",
    conversationId,
    userId: state.userId,
  });
}

export function removeSocketFromCalls(socket: WebSocket) {
  for (const [conversationId, call] of activeCalls) {
    for (const participant of call.participants.values()) {
      if (!participant.sockets.delete(socket)) continue;
      if (participant.sockets.size > 0) continue;

      call.participants.delete(participant.userId);
      if (call.participants.size === 0) {
        activeCalls.delete(conversationId);
      } else {
        broadcast(call, {
          type: "call.peer.left",
          conversationId,
          userId: participant.userId,
        });
      }
      break;
    }
  }
}

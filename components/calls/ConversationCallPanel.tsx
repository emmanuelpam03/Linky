"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  Loader2,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Video,
  X,
} from "lucide-react";
import { getCallIceServers } from "@/app/actions/calls/ice-servers";
import {
  parseConversationServerEvent,
  type CallParticipant,
  type CallSignal,
} from "@/lib/websocket";

type ConversationCallPanelProps = {
  conversationId: string;
  isGroup: boolean;
};

type IncomingCall = {
  hostName: string;
  mediaType: "audio" | "video";
};

export default function ConversationCallPanel({
  conversationId,
  isGroup,
}: ConversationCallPanelProps) {
  const maxParticipants = isGroup ? 6 : 2;
  const [isSocketReady, setIsSocketReady] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [mediaType, setMediaType] = useState<"audio" | "video" | null>(null);
  const [selfUserId, setSelfUserId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [callError, setCallError] = useState("");

  const socketRef = useRef<WebSocket | null>(null);
  const peerConnectionsRef = useRef(new Map<string, RTCPeerConnection>());
  const pendingCandidatesRef = useRef(
    new Map<string, RTCIceCandidateInit[]>(),
  );
  const localStreamRef = useRef<MediaStream | null>(null);
  const iceServersRef = useRef<RTCIceServer[]>([]);
  const selfUserIdRef = useRef<string | null>(null);
  const sendRef = useRef<(value: Record<string, unknown>) => void>(() => {});
  const activeCallRef = useRef(false);

  const closePeer = useCallback((userId: string) => {
    const peer = peerConnectionsRef.current.get(userId);
    if (peer) {
      peer.ontrack = null;
      peer.onicecandidate = null;
      peer.close();
      peerConnectionsRef.current.delete(userId);
    }
    pendingCandidatesRef.current.delete(userId);
    setRemoteStreams((current) => {
      const next = { ...current };
      delete next[userId];
      return next;
    });
  }, []);

  const stopMedia = useCallback(() => {
    for (const peerId of peerConnectionsRef.current.keys()) closePeer(peerId);
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStreams({});
  }, [closePeer]);

  const send = useCallback((value: Record<string, unknown>) => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(value));
    }
  }, []);

  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  const ensureMedia = useCallback(async (type: "audio" | "video") => {
    if (!iceServersRef.current.length) {
      const iceResult = await getCallIceServers(conversationId);
      if (!iceResult.success) throw new Error(iceResult.error);
      iceServersRef.current = iceResult.data;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("This browser does not support audio/video calls.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video",
    });
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = stream;
    setLocalStream(stream);
    setMediaType(type);
    setIsMuted(false);
    setIsCameraOff(false);
  }, [conversationId]);

  const createPeer = useCallback(
    (peerUserId: string) => {
      const existing = peerConnectionsRef.current.get(peerUserId);
      if (existing) return existing;

      const peer = new RTCPeerConnection({ iceServers: iceServersRef.current });
      peerConnectionsRef.current.set(peerUserId, peer);
      localStreamRef.current?.getTracks().forEach((track) => {
        peer.addTrack(track, localStreamRef.current!);
      });
      peer.onicecandidate = (event) => {
        if (!event.candidate) return;
        sendRef.current({
          type: "call.signal",
          conversationId,
          peerUserId,
          signal: {
            kind: "candidate",
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
          },
        });
      };
      peer.ontrack = (event) => {
        const stream = event.streams[0];
        if (stream) {
          setRemoteStreams((current) => ({ ...current, [peerUserId]: stream }));
        }
      };
      peer.onconnectionstatechange = () => {
        if (peer.connectionState === "failed") {
          setCallError(
            "A peer connection failed. Check TURN settings or try reconnecting.",
          );
        }
      };
      return peer;
    },
    [conversationId],
  );

  const flushCandidates = useCallback(
    async (peerUserId: string, peer: RTCPeerConnection) => {
      const candidates = pendingCandidatesRef.current.get(peerUserId) ?? [];
      pendingCandidatesRef.current.delete(peerUserId);
      for (const candidate of candidates) {
        await peer.addIceCandidate(candidate);
      }
    },
    [],
  );

  const handleSignal = useCallback(
    async (fromUserId: string, signal: CallSignal) => {
      try {
        const peer = createPeer(fromUserId);
        if (signal.kind === "candidate") {
          const candidate: RTCIceCandidateInit = {
            candidate: signal.candidate,
            sdpMid: signal.sdpMid,
            sdpMLineIndex: signal.sdpMLineIndex,
          };
          if (peer.remoteDescription) {
            await peer.addIceCandidate(candidate);
          } else {
            const queued = pendingCandidatesRef.current.get(fromUserId) ?? [];
            queued.push(candidate);
            pendingCandidatesRef.current.set(fromUserId, queued);
          }
          return;
        }

        await peer.setRemoteDescription({
          type: signal.descriptionType,
          sdp: signal.sdp,
        });
        await flushCandidates(fromUserId, peer);
        if (signal.descriptionType === "offer") {
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          if (peer.localDescription?.sdp) {
            sendRef.current({
              type: "call.signal",
              conversationId,
              peerUserId: fromUserId,
              signal: {
                kind: "description",
                descriptionType: "answer",
                sdp: peer.localDescription.sdp,
              },
            });
          }
        }
      } catch (error) {
        console.error("Could not process call signaling:", error);
        setCallError("Could not establish a connection with a participant.");
      }
    },
    [conversationId, createPeer, flushCandidates],
  );

  const startOffer = useCallback(
    async (peerUserId: string) => {
      try {
        const peer = createPeer(peerUserId);
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        if (peer.localDescription?.sdp) {
          sendRef.current({
            type: "call.signal",
            conversationId,
            peerUserId,
            signal: {
              kind: "description",
              descriptionType: "offer",
              sdp: peer.localDescription.sdp,
            },
          });
        }
      } catch (error) {
        console.error("Could not start call negotiation:", error);
        setCallError("Could not connect to a participant.");
      }
    },
    [conversationId, createPeer],
  );

  const handleServerEvent = useCallback(
    (serialized: string) => {
      const event = parseConversationServerEvent(serialized);
      if (!event) {
        console.error("Received an invalid call event.");
        return;
      }
      if (event.type === "error") {
        const errorMessages: Record<string, string> = {
          call_already_active: "A call is already active in this conversation.",
          call_not_active: "There is no active call to join.",
          call_full: "This call has reached its participant limit.",
          call_peer_unavailable: "That participant is no longer in the call.",
          call_not_authorized: isGroup
            ? "Only members of this group can call."
            : "Only friends in this conversation can call.",
        };
        setCallError(errorMessages[event.code] ?? "The call request failed.");
        if (
          event.code === "call_already_active" ||
          event.code === "call_not_active" ||
          event.code === "call_full" ||
          event.code === "call_not_authorized"
        ) {
          activeCallRef.current = false;
          stopMedia();
          setIsCallActive(false);
          setIsJoined(false);
          setParticipants([]);
          setMediaType(null);
        }
        if (event.code === "call_already_active") {
          sendRef.current({ type: "call.status", conversationId });
        }
        return;
      }
      if (
        !("conversationId" in event) ||
        event.conversationId !== conversationId
      ) {
        return;
      }

      if (event.type === "call.invited") {
        setIncomingCall({ hostName: event.hostName, mediaType: event.mediaType });
        setCallError("");
      } else if (event.type === "call.status") {
        if (!event.active) {
          activeCallRef.current = false;
          stopMedia();
          setIsCallActive(false);
          setIsJoined(false);
          setIncomingCall(null);
          setParticipants([]);
          setMediaType(null);
          return;
        }
        activeCallRef.current = true;
        setIsCallActive(true);
        setMediaType(event.mediaType);
        selfUserIdRef.current = event.selfUserId;
        setSelfUserId(event.selfUserId);
        setParticipants(event.participants);
        if (event.selfJoined) {
          setIsJoined(true);
          setIncomingCall(null);
          if (!localStreamRef.current) {
            setCallError("Enable your microphone to join the active call.");
          }
          for (const participant of event.participants) {
            if (
              participant.userId !== event.selfUserId &&
              event.selfUserId < participant.userId
            ) {
              void startOffer(participant.userId);
            }
          }
        } else {
          const host = event.participants.find(
            (participant) => participant.userId === event.hostUserId,
          );
          setIncomingCall({
            hostName: host?.name ?? (isGroup ? "A group member" : "Your friend"),
            mediaType: event.mediaType,
          });
        }
      } else if (event.type === "call.peer.joined") {
        setParticipants((current) =>
          current.some((participant) => participant.userId === event.userId)
            ? current
            : [...current, { userId: event.userId, name: event.name }],
        );
        if (
          selfUserIdRef.current &&
          selfUserIdRef.current < event.userId
        ) {
          void startOffer(event.userId);
        }
      } else if (event.type === "call.peer.left") {
        closePeer(event.userId);
        setParticipants((current) =>
          current.filter((participant) => participant.userId !== event.userId),
        );
      } else if (event.type === "call.signal") {
        void handleSignal(event.fromUserId, event.signal);
      }
    },
    [
      closePeer,
      conversationId,
      handleSignal,
      isGroup,
      startOffer,
      stopMedia,
    ],
  );

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_WS_URL;
    if (!url) return;

    let active = true;
    let socket: WebSocket;
    try {
      socket = new WebSocket(url);
    } catch (error) {
      console.error("Could not create the call WebSocket:", error);
      window.setTimeout(
        () => setCallError("Could not connect to the call server."),
        0,
      );
      return;
    }

    socketRef.current = socket;
    socket.addEventListener("open", () => {
      if (!active) return;
      setIsSocketReady(true);
      socket.send(JSON.stringify({ type: "call.status", conversationId }));
    });
    socket.addEventListener("message", (event: MessageEvent) => {
      if (typeof event.data === "string") handleServerEvent(event.data);
    });
    socket.addEventListener("error", () => {
      if (active) setCallError("The call server connection failed.");
    });
    socket.addEventListener("close", () => {
      if (!active) return;
      activeCallRef.current = false;
      stopMedia();
      setIsSocketReady(false);
      setIsCallActive(false);
      setIsJoined(false);
      setParticipants([]);
      setCallError("Disconnected from the call server.");
    });

    return () => {
      active = false;
      if (activeCallRef.current) {
        socket.send(
          JSON.stringify({ type: "call.leave", conversationId }),
        );
      }
      socket.close(1000, "Call panel closed");
      socketRef.current = null;
      stopMedia();
    };
  }, [conversationId, handleServerEvent, stopMedia]);

  const startCall = async (type: "audio" | "video") => {
    if (!isSocketReady || isStarting) return;
    setIsStarting(true);
    setCallError("");
    try {
      await ensureMedia(type);
      send({ type: "call.start", conversationId, mediaType: type });
    } catch (error) {
      console.error("Could not start call:", error);
      setCallError(
        error instanceof Error ? error.message : "Could not access your microphone.",
      );
    } finally {
      setIsStarting(false);
    }
  };

  const joinCall = async () => {
    if (!incomingCall || !isSocketReady || isStarting) return;
    setIsStarting(true);
    setCallError("");
    try {
      await ensureMedia(incomingCall.mediaType);
      send({ type: "call.join", conversationId });
    } catch (error) {
      console.error("Could not join call:", error);
      setCallError(
        error instanceof Error ? error.message : "Could not access your microphone.",
      );
    } finally {
      setIsStarting(false);
    }
  };

  const leaveCall = () => {
    if (isJoined) send({ type: "call.leave", conversationId });
    activeCallRef.current = false;
    stopMedia();
    setIsCallActive(false);
    setIsJoined(false);
    setIncomingCall(null);
    setParticipants([]);
    setMediaType(null);
    setCallError("");
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    localStreamRef.current
      ?.getAudioTracks()
      .forEach((track) => (track.enabled = !nextMuted));
    setIsMuted(nextMuted);
  };

  const toggleCamera = () => {
    const nextOff = !isCameraOff;
    localStreamRef.current
      ?.getVideoTracks()
      .forEach((track) => (track.enabled = !nextOff));
    setIsCameraOff(nextOff);
  };

  return (
    <div className="border-b border-(--color-border-tertiary) bg-(--color-background-secondary) px-4 py-3">
      {incomingCall && !isJoined ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-(--color-text-primary)">
            {incomingCall.hostName} started a {incomingCall.mediaType === "video" ? "video" : "voice"} call.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void joinCall()}
              disabled={isStarting}
              className="rounded-lg bg-(--color-brand-400) px-3 py-2 text-sm text-white disabled:opacity-50"
            >
              {isStarting ? <Loader2 className="size-4 animate-spin" /> : "Join"}
            </button>
            <button
              type="button"
              onClick={() => setIncomingCall(null)}
              className="rounded-lg border border-(--color-border-secondary) px-3 py-2 text-sm text-(--color-text-secondary)"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ) : isCallActive && isJoined ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-(--color-text-primary)">
              {mediaType === "video" ? "Video" : "Voice"} call · {participants.length}/{maxParticipants}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
                className="rounded-lg border border-(--color-border-secondary) p-2 text-(--color-text-primary)"
              >
                {isMuted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
              </button>
              {mediaType === "video" && (
                <button
                  type="button"
                  onClick={toggleCamera}
                  aria-label={isCameraOff ? "Turn camera on" : "Turn camera off"}
                  className="rounded-lg border border-(--color-border-secondary) p-2 text-(--color-text-primary)"
                >
                  {isCameraOff ? <CameraOff className="size-4" /> : <Camera className="size-4" />}
                </button>
              )}
              <button
                type="button"
                onClick={leaveCall}
                className="flex items-center gap-2 rounded-lg bg-(--color-coral-500) px-3 py-2 text-sm text-white"
              >
                <PhoneOff className="size-4" />
                Leave
              </button>
            </div>
          </div>
          {callError && <p role="alert" className="text-xs text-(--color-coral-500)">{callError}</p>}
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {mediaType === "video" && localStream && (
              <video
                autoPlay
                muted
                playsInline
                ref={(element) => {
                  if (element && element.srcObject !== localStream) {
                    element.srcObject = localStream;
                  }
                }}
                className="aspect-video w-full rounded-lg bg-black object-cover"
              />
            )}
            {participants
              .filter((participant) => participant.userId !== selfUserId)
              .map((participant) => {
                const stream = remoteStreams[participant.userId];
                return (
                  <div
                    key={participant.userId}
                    className="relative flex aspect-video items-center justify-center rounded-lg bg-(--color-background-tertiary) text-sm text-(--color-text-secondary)"
                  >
                    {mediaType === "video" && stream ? (
                      <video
                        autoPlay
                        playsInline
                        ref={(element) => {
                          if (element && element.srcObject !== stream) {
                            element.srcObject = stream;
                          }
                        }}
                        className="absolute inset-0 size-full rounded-lg bg-black object-cover"
                      />
                    ) : (
                      participant.name
                    )}
                    {mediaType === "audio" && stream && (
                      <audio
                        autoPlay
                        ref={(element) => {
                          if (element && element.srcObject !== stream) {
                            element.srcObject = stream;
                          }
                        }}
                        className="hidden"
                      />
                    )}
                  </div>
                );
              })}
          </div>
          {isJoined && !localStream && (
            <button
              type="button"
              onClick={() => {
                if (mediaType) {
                  void ensureMedia(mediaType).catch((error: unknown) => {
                    console.error("Could not enable call media:", error);
                    setCallError("Could not access your microphone or camera.");
                  });
                }
              }}
              className="rounded-lg bg-(--color-brand-400) px-3 py-2 text-sm text-white"
            >
              Enable microphone and camera
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-(--color-text-secondary)">
            Calls support up to {maxParticipants} people.
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void startCall("audio")}
              disabled={!isSocketReady || isStarting}
              className="flex items-center gap-2 rounded-lg border border-(--color-border-secondary) px-3 py-2 text-sm text-(--color-text-primary) disabled:opacity-50"
            >
              {isStarting ? <Loader2 className="size-4 animate-spin" /> : <Phone className="size-4" />}
              Voice call
            </button>
            <button
              type="button"
              onClick={() => void startCall("video")}
              disabled={!isSocketReady || isStarting}
              className="flex items-center gap-2 rounded-lg border border-(--color-border-secondary) px-3 py-2 text-sm text-(--color-text-primary) disabled:opacity-50"
            >
              {isStarting ? <Loader2 className="size-4 animate-spin" /> : <Video className="size-4" />}
              Video call
            </button>
          </div>
        </div>
      )}
      {!incomingCall && callError && !isCallActive && (
        <p role="alert" className="mt-2 text-xs text-(--color-coral-500)">
          {callError}
        </p>
      )}
      {!process.env.NEXT_PUBLIC_WS_URL && (
        <p role="alert" className="mt-2 text-xs text-(--color-coral-500)">
          NEXT_PUBLIC_WS_URL is required for calls.
        </p>
      )}
    </div>
  );
}

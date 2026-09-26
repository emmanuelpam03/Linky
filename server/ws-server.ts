import "dotenv/config";
import { createServer } from "node:http";
import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocketServer } from "ws";
import { auth } from "../lib/auth";
import prisma from "../lib/prisma";
import { handleClientMessage } from "./websocket/client-events";
import {
  sendJson,
  setClientState,
} from "./websocket/connection-state";
import { removeClient } from "./websocket/presence-events";

const port = Number(process.env.WS_PORT ?? 3001);
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("WS_PORT must be a valid TCP port.");
}

if (!appUrl) {
  throw new Error("NEXT_PUBLIC_APP_URL is required for WebSocket origin checks.");
}

const appOrigin = new URL(appUrl).origin;
const httpServer = createServer((request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    response.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    response.end("ok");
    return;
  }

  response.writeHead(404);
  response.end("Not found");
});

const webSocketServer = new WebSocketServer({
  noServer: true,
  maxPayload: 16 * 1024,
});

function rejectUpgrade(
  socket: Duplex,
  status: number,
  statusText: string,
) {
  if (socket.destroyed) return;

  socket.write(
    `HTTP/1.1 ${status} ${statusText}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`,
  );
  socket.destroy();
}

async function authenticateRequest(request: IncomingMessage) {
  if (request.headers.origin !== appOrigin) return null;

  const headers = new Headers();
  if (request.headers.cookie) {
    headers.set("cookie", request.headers.cookie);
  }

  const session = await auth.api.getSession({ headers });
  if (!session?.user?.id) return null;

  return {
    userId: session.user.id,
    name: session.user.name,
  };
}

httpServer.on("upgrade", (request, socket, head) => {
  void authenticateRequest(request)
    .then((user) => {
      if (!user) {
        rejectUpgrade(socket, 401, "Unauthorized");
        return;
      }

      webSocketServer.handleUpgrade(request, socket, head, (client) => {
        setClientState(client, {
          ...user,
          subscriptions: new Set(),
          lastTypingUpdate: new Map(),
        });
        webSocketServer.emit("connection", client, request);
      });
    })
    .catch((error: unknown) => {
      console.error("WebSocket authentication failed:", error);
      rejectUpgrade(socket, 500, "Internal Server Error");
    });
});

webSocketServer.on("connection", (socket) => {
  sendJson(socket, { type: "ready" });

  let messageQueue = Promise.resolve();
  socket.on("message", (data, isBinary) => {
    messageQueue = messageQueue
      .then(() => handleClientMessage(socket, data, isBinary))
      .catch((error: unknown) => {
        console.error("WebSocket event handling failed:", error);
        sendJson(socket, { type: "error", code: "request_failed" });
      });
  });

  socket.on("close", () => {
    void removeClient(socket).catch((error: unknown) => {
      console.error("Failed to remove a disconnected WebSocket client:", error);
    });
  });
  socket.on("error", (error) => {
    console.error("WebSocket connection error:", error.message);
  });
});

httpServer.on("error", (error) => {
  console.error("WebSocket server error:", error);
  process.exitCode = 1;
});

httpServer.listen(port, () => {
  console.log(`WebSocket server listening on port ${port}`);
});

function shutdown() {
  for (const socket of webSocketServer.clients) {
    socket.close(1001, "Server shutting down");
  }

  httpServer.close(() => {
    void prisma.$disconnect();
  });
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

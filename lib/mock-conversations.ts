import type { Conversation } from "@/types";

export const mockConversations: Conversation[] = [
  {
    id: "jamie-dlamini",
    name: "Jamie Dlamini",
    initials: "JD",
    lastMessage: "Sounds good, see you then",
    timestamp: "12:04",
    isOnline: true,
  },
  {
    id: "priya-veerasamy",
    name: "Priya Veerasamy",
    initials: "PV",
    lastMessage: "Sent a photo",
    timestamp: "Yesterday",
  },
  {
    id: "cs-project-team",
    name: "CS Project Team",
    initials: "",
    lastMessage: "Lina: pushed the new...",
    timestamp: "Mon",
    unreadCount: 2,
    isGroup: true,
  },
  {
    id: "ravi-kumar",
    name: "Ravi Kumar",
    initials: "RK",
    lastMessage: "Typing...",
    timestamp: "Sun",
    isTyping: true,
  },
];

export function getConversationById(id: string): Conversation | undefined {
  return mockConversations.find((c) => c.id === id);
}

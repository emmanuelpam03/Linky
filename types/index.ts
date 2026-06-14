export type Conversation = {
  id: string;
  name: string;
  initials: string;
  lastMessage: string;
  timestamp: string;
  isOnline?: boolean;
  isTyping?: boolean;
  unreadCount?: number;
  isGroup?: boolean;
};

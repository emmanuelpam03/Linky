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

export type GroupIcon = "code" | "music" | "home";

export type Group = {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  icon: GroupIcon;
};

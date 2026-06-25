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

// ── Friend system types ──

export type UserResult = {
  id: string;
  name: string;
  username: string;
  image: string | null;
};

export type FriendRequest = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: Date;
  sender: UserResult;
  receiver: UserResult;
};

export type Friend = {
  id: string;
  name: string;
  username: string;
  image: string | null;
};

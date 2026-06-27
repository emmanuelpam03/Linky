// ── Legacy UI types (mock data) ──────────────────────────────────────────────

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

// ── User ─────────────────────────────────────────────────────────────────────

export type UserResult = {
  id: string;
  name: string;
  username: string;
  image: string | null;
};

// ── Friends ──────────────────────────────────────────────────────────────────

export type Friend = {
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

export type FriendRequestWithSender = {
  id: string;
  senderId: string;
  receiverId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: Date;
  updatedAt: Date;
  sender: {
    id: string;
    name: string;
    username: string;
    image: string | null;
  };
};

export type FriendRequestWithReceiver = {
  id: string;
  senderId: string;
  receiverId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: Date;
  updatedAt: Date;
  receiver: {
    id: string;
    name: string;
    username: string;
    image: string | null;
  };
};

export type FriendshipWithFriend = {
  id: string;
  createdAt: Date;
  userId: string;
  friendId: string;
  friend: {
    id: string;
    name: string;
    username: string;
    image: string | null;
  };
};

// ── Conversations ─────────────────────────────────────────────────────────────

export type MemberWithUser = {
  userId: string;
  user: {
    id: string;
    name: string;
    username: string;
    image: string | null;
  };
};

export type LastMessage = {
  text: string | null;
  imageUrl: string | null;
  fileUrl: string | null;
  fileName: string | null;
  createdAt: Date;
};

export type ConversationWithIncludes = {
  id: string;
  type: "DIRECT" | "GROUP";
  name: string | null;
  image: string | null;
  lastMessageAt: Date | null;
  members: MemberWithUser[];
  messages: LastMessage[];
};

export type ConversationWithMembers = {
  id: string;
  type: "DIRECT" | "GROUP";
  name: string | null;
  image: string | null;
  members: MemberWithUser[];
};

export type ConversationListItem = {
  id: string;
  type: "DIRECT" | "GROUP";
  name: string;
  image: string | null;
  lastMessageAt: Date | null;
  lastMessage: string | null;
  unreadCount: number;
  otherUser: {
    id: string;
    name: string;
    username: string;
    image: string | null;
  } | null;
};

export type ConversationDetail = {
  id: string;
  type: "DIRECT" | "GROUP";
  name: string;
  image: string | null;
  otherUser: {
    id: string;
    name: string;
    username: string;
    image: string | null;
    bio: string | null;
  } | null;
};

// ── Groups ────────────────────────────────────────────────────────────────────

export type GroupListItem = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  lastMessageAt: Date | null;
  lastMessage: string | null;
  memberCount: number;
  role: "ADMIN" | "MEMBER";
};

export type GroupMember = {
  id: string;
  userId: string;
  role: "ADMIN" | "MEMBER";
  joinedAt: Date;
  user: {
    id: string;
    name: string;
    username: string;
    image: string | null;
  };
};

export type GroupDetail = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  createdBy: string;
  memberCount: number;
  members: GroupMember[];
  currentUserRole: "ADMIN" | "MEMBER";
};

// ── Messages ──────────────────────────────────────────────────────────────────

export type MessageWithSender = {
  id: string;
  text: string | null;
  imageUrl: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  createdAt: Date;
  senderId: string;
  deletedFor: string[];
  deletedForEveryone: boolean;
  sender: {
    id: string;
    name: string;
    username: string;
    image: string | null;
  };
};

export type MessageItem = {
  id: string;
  text: string | null;
  imageUrl: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  createdAt: Date;
  senderId: string;
  sender: {
    id: string;
    name: string;
    username: string;
    image: string | null;
  };
  isOwn: boolean;
  deletedForEveryone: boolean;
  deletedForSelf: boolean;
};

// ── Prisma intermediate types ─────────────────────────────────────────────────

export type RawGroupConversation = {
  id: string;
  name: string | null;
  description: string | null;
  image: string | null;
  createdBy: string;
  lastMessageAt: Date | null;
  members: (MemberWithUser & { id: string; role: string; joinedAt: Date })[];
  messages: (LastMessage & { sender: { name: string } })[];
};

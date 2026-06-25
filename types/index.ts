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
  } | null;
};

export type ConversationWithMembers = {
  id: string;
  type: "DIRECT" | "GROUP";
  name: string | null;
  image: string | null;
  members: MemberWithUser[];
};

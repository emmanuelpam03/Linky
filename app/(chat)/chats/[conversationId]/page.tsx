import { notFound } from "next/navigation";
import ChatWindow from "@/components/chats/ChatWindow";
import { getConversationById } from "@/lib/mock-conversations";

type PageProps = {
  params: Promise<{ conversationId: string }>;
};

export default async function ConversationPage({ params }: PageProps) {
  const { conversationId } = await params;
  const conversation = getConversationById(conversationId);

  if (!conversation) {
    notFound();
  }

  return <ChatWindow conversation={conversation} />;
}

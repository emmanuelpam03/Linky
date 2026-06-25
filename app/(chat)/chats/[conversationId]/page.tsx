import { notFound } from "next/navigation";
import ChatWindow from "@/components/chats/ChatWindow";
import { getConversation } from "@/app/actions/conversations/get";

type PageProps = {
  params: Promise<{ conversationId: string }>;
};

export default async function ConversationPage({ params }: PageProps) {
  const { conversationId } = await params;
  const result = await getConversation(conversationId);

  if (!result.success || !result.data) {
    notFound();
  }

  return <ChatWindow conversation={result.data} />;
}

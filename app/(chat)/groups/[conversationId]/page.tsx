import { notFound } from "next/navigation";
import GroupWindow from "@/components/groups/GroupWindow";
import { getGroupById } from "@/lib/mock-groups";

type PageProps = {
  params: Promise<{ conversationId: string }>;
};

export default async function GroupConversationPage({ params }: PageProps) {
  const { conversationId } = await params;
  const group = getGroupById(conversationId);

  if (!group) {
    notFound();
  }

  return <GroupWindow group={group} />;
}

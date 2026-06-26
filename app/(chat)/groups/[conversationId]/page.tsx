import { notFound } from "next/navigation";
import GroupWindow from "@/components/groups/GroupWindow";
import { getGroup } from "@/app/actions/groups/get";

type PageProps = {
  params: Promise<{ conversationId: string }>;
};

export default async function GroupConversationPage({ params }: PageProps) {
  const { conversationId } = await params;
  const result = await getGroup(conversationId);

  if (!result.success || !result.data) {
    notFound();
  }

  return <GroupWindow group={result.data} />;
}

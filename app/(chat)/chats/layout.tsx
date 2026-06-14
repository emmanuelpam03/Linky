import ConversationList from "@/components/chats/ConversationList";

export default function ChatsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-1 overflow-hidden">
      <aside className="flex w-72 shrink-0 flex-col border-r border-(--color-border-tertiary) bg-(--color-background-primary)">
        <ConversationList />
      </aside>
      <section className="min-w-0 flex-1">{children}</section>
    </div>
  );
}

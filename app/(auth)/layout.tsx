export default function ChatLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <div className="flex min-h-full flex-1">
        {children}
      </div>
    );
  }
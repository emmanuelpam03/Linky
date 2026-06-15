export default function ChatLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <div className="flex min-h-svh w-full">
        {children}
      </div>
    );
  }
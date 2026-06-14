import NavRail from "./NavRail";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <NavRail />
      <main className="flex-1 flex min-h-0 min-w-0 overflow-hidden">{children}</main>
    </div>
  );
}
import NavRail from "./NavRail";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <NavRail />
      <main className="flex-1 flex overflow-hidden">{children}</main>
    </div>
  );
}
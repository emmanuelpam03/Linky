import NavRail from "./NavRail";
import { AppRealtimeProvider } from "@/components/providers/AppRealtimeProvider";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppRealtimeProvider>
      <div className="flex h-screen overflow-hidden">
        <NavRail />
        <main className="flex-1 flex min-h-0 min-w-0 overflow-hidden">
          {children}
        </main>
      </div>
    </AppRealtimeProvider>
  );
}
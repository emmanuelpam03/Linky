"use client";

import ProfileForm from "@/components/settings/ProfileForm";
import PasswordForm from "@/components/settings/PasswordForm";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const Page = () => {
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
        },
      },
    });
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-(--color-background-secondary)">
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
        <div className="mx-auto flex w-full max-w-2xl flex-col">
          <header className="space-y-2 pb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-(--color-text-primary)">
              Settings
            </h1>
            <p className="text-sm text-(--color-text-secondary)">
              Update your profile details, account information, and security
              settings.
            </p>
          </header>

          <ProfileForm />
          <PasswordForm />

          <section className="mt-6 rounded-xl border border-(--color-border-tertiary) bg-(--color-background-primary) px-5 py-5 shadow-sm">
            <div className="flex items-center justify-between gap-4 rounded-xl bg-(--color-coral-50) px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-(--color-coral-800)">
                  Log out
                </h2>
                <p className="mt-1 text-sm text-(--color-coral-600)">
                  You&apos;ll need to sign in again on this device
                </p>
              </div>

              <Button
                onClick={handleLogout}
                variant="outline"
                size="form"
                className="border-(--color-coral-400) bg-transparent px-5 text-(--color-coral-600) hover:bg-(--color-coral-100) hover:text-(--color-coral-800)"
              >
                <LogOut className="size-4" />
                Log out
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Page;

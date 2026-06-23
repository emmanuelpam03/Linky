"use client";

import { Button } from "@/components/ui/button";
import { FormField, PasswordInput } from "@/components/ui/form-field";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient, useSession } from "@/lib/auth-client";
import Link from "next/link";
import { sendPasswordChangeNotification } from "@/app/actions/auth/notify";
import { useState } from "react";
import { passwordSchema, PasswordSchema } from "@/lib/schemas/auth.schema";


const PasswordForm = () => {
  const { data: session } = useSession();

  const form = useForm<PasswordSchema>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const [isSuccess, setIsSuccess] = useState(false);

  const onSubmit = async (data: PasswordSchema) => {
    setIsSuccess(false);

    const result = await authClient.changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
      revokeOtherSessions: true,
    });

    if (result.error) {
      form.setError("currentPassword", {
        message: result.error.message ?? "Incorrect password.",
      });
      return;
    }

    if (session?.user?.email) {
      await sendPasswordChangeNotification(session.user.email);
    }

    form.reset();
    setIsSuccess(true);
  };

  return (
    <section className="mt-6 rounded-xl border border-(--color-border-tertiary) bg-(--color-background-primary) px-5 py-5 shadow-sm">
      <h2 className="text-base font-semibold text-(--color-text-primary)">
        Password
      </h2>
      <p className="mt-1 text-sm text-(--color-text-secondary)">
        Update your password. You&apos;ll be signed out of other devices.
      </p>

      <form className="mt-5 grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField label="Current password">
          <PasswordInput
            placeholder="Enter current password"
            {...form.register("currentPassword")}
          />
        </FormField>
        {form.formState.errors.currentPassword && (
          <p className="text-sm text-(--color-coral-400)">
            {form.formState.errors.currentPassword.message}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FormField label="New password">
              <PasswordInput
                placeholder="At least 8 characters"
                {...form.register("newPassword")}
              />
            </FormField>
            {form.formState.errors.newPassword && (
              <p className="mt-1 text-sm text-(--color-coral-400)">
                {form.formState.errors.newPassword.message}
              </p>
            )}
          </div>

          <div>
            <FormField label="Confirm password">
              <PasswordInput
                placeholder="Re-enter new password"
                {...form.register("confirmPassword")}
              />
            </FormField>
            {form.formState.errors.confirmPassword && (
              <p className="mt-1 text-sm text-(--color-coral-400)">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        {form.formState.errors.root?.serverError && (
          <p className="text-sm text-(--color-coral-400) text-center">
            {form.formState.errors.root.serverError.message}
          </p>
        )}

        {isSuccess && (
          <p className="text-sm text-(--color-brand-400) text-center">
            Password updated successfully.
          </p>
        )}

        <div className="flex items-center justify-between pt-1 flex-wrap gap-3">
          <Button
            type="submit"
            variant="brand"
            size="form"
            className="min-w-44"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Update password"
            )}
          </Button>

          <Link
            href="/forgot-password"
            className="text-sm font-medium text-(--color-brand-800)"
          >
            Forgot password?
          </Link>
        </div>
      </form>
    </section>
  );
};

export default PasswordForm;

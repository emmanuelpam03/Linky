"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload } from "lucide-react";
import { authClient, useSession } from "@/lib/auth-client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/types/auth";
import { profileSchema, ProfileSchema } from "@/lib/schemas/auth.schema";
import { uploadAvatar } from "@/app/actions/upload/avatar";

const ProfileForm = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const user = session?.user as User | undefined;

  const [isSuccess, setIsSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatarUrl = user?.image ?? null;

  const form = useForm<ProfileSchema>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      username: "",
      bio: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        fullName: user.name ?? "",
        username: user.username ?? "",
        bio: user.bio ?? "",
      });
    }
  }, [user, form]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("avatar", file);

    const result = await uploadAvatar(formData);

    if (!result.success) {
      setUploadError(result.error ?? "Upload failed.");
      setIsUploading(false);
      return;
    }

    router.refresh();
    setIsUploading(false);
  };

  const onSubmit = async (data: ProfileSchema) => {
    setIsSuccess(false);

    const result = await authClient.updateUser({
      name: data.fullName,
      bio: data.bio,
    } as Parameters<typeof authClient.updateUser>[0]);

    if (result.error) {
      form.setError("root.serverError", {
        message: result.error.message ?? "Failed to update profile.",
      });
      return;
    }

    form.reset(data);
    setIsSuccess(true);
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <section className="rounded-xl border border-(--color-border-tertiary) bg-(--color-background-primary) px-5 py-5 shadow-sm">
      <h2 className="text-base font-semibold text-(--color-text-primary)">
        Profile
      </h2>
      <p className="mt-1 text-sm text-(--color-text-secondary)">
        Your public profile information visible to friends.
      </p>

      <div className="mt-5 flex items-start gap-5">
        <Avatar
          size="lg"
          className="shrink-0"
          style={{ width: 96, height: 96 }}
        >
          {avatarUrl && (
            <AvatarImage src={avatarUrl} alt={user?.name ?? "Avatar"} />
          )}
          <AvatarFallback className="bg-(--color-brand-50) text-2xl font-semibold text-(--color-brand-900)">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="pt-2">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <Button
            type="button"
            variant="brand"
            size="sm"
            className="gap-2 rounded-lg"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            {isUploading ? "Uploading..." : "Upload photo"}
          </Button>
          <p className="mt-2 text-sm text-(--color-text-secondary)">
            JPG, PNG or WebP, max 2MB
          </p>
          {uploadError && (
            <p className="mt-1 text-sm text-(--color-coral-400)">
              {uploadError}
            </p>
          )}
        </div>
      </div>

      <form className="mt-6 grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField label="Full name">
          <Input {...form.register("fullName")} />
        </FormField>
        {form.formState.errors.fullName && (
          <p className="text-sm text-(--color-coral-400)">
            {form.formState.errors.fullName.message}
          </p>
        )}

        <FormField label="Username">
          <Input {...form.register("username")} disabled />
        </FormField>

        <FormField label="Bio">
          <Textarea rows={3} {...form.register("bio")} />
        </FormField>

        {form.formState.errors.root?.serverError && (
          <p className="text-sm text-(--color-coral-400) text-center">
            {form.formState.errors.root.serverError.message}
          </p>
        )}

        {isSuccess && (
          <p className="text-sm text-(--color-brand-400) text-center">
            Profile updated successfully.
          </p>
        )}

        <div className="flex justify-start pt-1">
          <Button
            type="submit"
            variant="brand"
            size="form"
            className="min-w-44"
            disabled={form.formState.isSubmitting || !form.formState.isDirty}
          >
            {form.formState.isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </form>
    </section>
  );
};

export default ProfileForm;

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  authLinkClass,
  FormField,
  IconInput,
  PasswordInput,
} from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, UserRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, SignupSchema } from "@/lib/schemas/auth.schema";
import { signUp } from "@/app/actions/signup";
// import { signUp } from "@/lib/auth-client";

export default function SignupForm() {
  const router = useRouter();

  const form = useForm<SignupSchema>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      username: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignupSchema) => {
    const result = await signUp(data);

    if (result.error) {
      console.log("AUTH ERROR:", result.error);

      form.setError("root.serverError", {
        message: result.error.message,
      });
    }

    router.push(`/verify?email=${encodeURIComponent(data.email)}`);
  };

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <FormField label="Full name">
        <Input
          type="text"
          placeholder="Emmanuel Pam"
          {...form.register("fullName")}
        />
      </FormField>
      {form.formState.errors.fullName && (
        <p className="text-sm text-(--color-coral-400)">
          {form.formState.errors.fullName.message}
        </p>
      )}

      <FormField label="Username">
        <IconInput
          type="text"
          icon={UserRound}
          placeholder="emmanuel.dev"
          {...form.register("username")}
        />
      </FormField>
      {form.formState.errors.username && (
        <p className="text-sm text-(--color-coral-400)">
          {form.formState.errors.username.message}
        </p>
      )}
      <FormField label="Email">
        <IconInput
          type="email"
          icon={Mail}
          placeholder="you@example.com"
          {...form.register("email")}
        />
      </FormField>

      {form.formState.errors.email && (
        <p className="text-sm text-(--color-coral-400)">
          {form.formState.errors.email.message}
        </p>
      )}

      <FormField label="Password">
        <PasswordInput
          placeholder="At least 8 characters"
          {...form.register("password")}
        />
      </FormField>

      {form.formState.errors.password && (
        <p className="text-sm text-(--color-coral-400)">
          {form.formState.errors.password.message}
        </p>
      )}

      {form.formState.errors.root?.serverError && (
        <p className="text-sm text-(--color-coral-400)">
          {form.formState.errors.root.serverError.message}
        </p>
      )}
      {form.formState.errors.root && (
        <p className="text-sm text-(--color-coral-400) text-center">
          {form.formState.errors.root.message}
        </p>
      )}

      <Button
        type="submit"
        variant="brand"
        size="form"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <span>Create account</span>
        )}
      </Button>

      <p className="pt-1 text-center text-sm text-(--color-text-secondary)">
        Already have an account?{" "}
        <Link href="/login" className={authLinkClass}>
          Log in
        </Link>
      </p>
    </form>
  );
}

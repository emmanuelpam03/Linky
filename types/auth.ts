import type { auth } from "@/lib/auth";

type Session = typeof auth.$Infer.Session;

export type User = Session["user"] & {
  bio?: string | null;
};

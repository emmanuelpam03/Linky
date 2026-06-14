"use client";

import { Button } from "@/components/ui/button";

type CreateGroupModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function CreateGroupModal({
  open,
  onOpenChange,
}: CreateGroupModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-lg border border-(--color-border-tertiary) bg-(--color-background-primary) p-6 shadow-lg">
        <h2 className="text-base font-semibold text-(--color-text-primary)">
          Create a group
        </h2>
        <p className="mt-2 text-sm text-(--color-text-secondary)">
          Group creation coming soon.
        </p>
        <div className="mt-6 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

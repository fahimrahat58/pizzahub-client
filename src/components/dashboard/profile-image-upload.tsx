"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ImageUpload } from "@/components/shared/ui-kit";
import { apiFetch } from "@/lib/api";
import type { UserDto } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Uploads through the existing ImgBB proxy and immediately persists the
 * returned URL on the user document, so the avatar updates without a second
 * "save" step.
 */
export function ProfileImageUpload({
  image,
  onSaved,
}: {
  image: string;
  onSaved: (user: UserDto) => void;
}) {
  const [saving, setSaving] = useState(false);

  const save = async (url: string) => {
    if (saving || !url || url === image) return;
    setSaving(true);
    try {
      const data = await apiFetch<{ success: boolean; user: UserDto }>(
        "/api/users/me/image",
        { method: "PATCH", body: { image: url } },
      );
      onSaved(data.user);
      toast.success("Profile photo updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update profile photo",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn("space-y-2", saving && "pointer-events-none opacity-70")}>
      <ImageUpload
        value={image}
        onChange={(url) => void save(url)}
        label="Profile image"
        hint="JPG, PNG, WebP or GIF up to 5 MB. Saved automatically after upload."
        aspect="aspect-square"
      />
      {saving ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" /> Saving to your profile...
        </p>
      ) : null}
    </div>
  );
}

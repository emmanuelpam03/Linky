"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  uploadImageToImageKit,
  validateImageFile,
} from "@/lib/imagekit/upload";
import { headers } from "next/headers";

export async function uploadAvatar(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const file = formData.get("avatar") as File;
  const validationResult = await validateImageFile(file);
  if (!validationResult.success) {
    return validationResult;
  }

  try {
    const result = await uploadImageToImageKit(
      file,
      {
        folder: "converse/avatars",
        publicId: `user_${session.user.id}`,
        overwrite: true,
      },
      validationResult.format,
    );

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: result.url },
    });

    return { success: true, imageUrl: result.url };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

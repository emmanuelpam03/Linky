"use server";

import cloudinary from "@/lib/cloudinary";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function uploadAvatar(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const file = formData.get("avatar") as File;
  if (!file) {
    return { success: false, error: "No file provided" };
  }

  // Validate type and size
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: "Only JPG, PNG, or WebP files are allowed",
    };
  }

  if (file.size > 2 * 1024 * 1024) {
    return { success: false, error: "File must be under 2MB" };
  }

  try {
    // Convert file to buffer for Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log("BUFFER SIZE:", buffer.length);
    
    // Upload to Cloudinary
    const result = await new Promise<{ secure_url: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "converse/avatars",
              public_id: `avatar_${session.user.id}`,
              overwrite: true,
              transformation: [
                { width: 200, height: 200, crop: "fill", gravity: "face" },
              ],
            },
            (error, result) => {
              if (error || !result) reject(error);
              else resolve(result);
            },
          )
          .end(buffer);
      },
    );

    // Update user image via Better Auth
    await auth.api.updateUser({
      headers: await headers(),
      body: { image: result.secure_url },
    });

    return { success: true, imageUrl: result.secure_url };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { userTable } from "../../database/schema";
import { userUploadedAvatarUrl } from "../../utils/user-display-image";
import { detectAvatarMime, MAX_AVATAR_BYTES } from "./detect-image-mime";

export default async function uploadUserAvatar(
  userId: string,
  file: File | Blob,
): Promise<{ image: string }> {
  if (file.size > MAX_AVATAR_BYTES) {
    throw new HTTPException(400, { message: "File too large" });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length === 0) {
    throw new HTTPException(400, { message: "Empty file" });
  }
  if (buf.length > MAX_AVATAR_BYTES) {
    throw new HTTPException(400, { message: "File too large" });
  }

  const mime = detectAvatarMime(buf);
  if (!mime) {
    throw new HTTPException(400, {
      message: "Unsupported image type (use JPEG, PNG or WebP)",
    });
  }

  const avatarUpdatedAt = new Date();
  const imageUrl = userUploadedAvatarUrl(userId, avatarUpdatedAt);

  await db
    .update(userTable)
    .set({
      avatarBlob: buf,
      avatarMimeType: mime,
      avatarUpdatedAt,
      image: imageUrl,
    })
    .where(eq(userTable.id, userId));

  return { image: imageUrl };
}

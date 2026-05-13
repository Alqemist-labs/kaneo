import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { userTable } from "../../database/schema";

export default async function deleteUserAvatar(userId: string): Promise<void> {
  const [row] = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);

  if (!row) {
    throw new HTTPException(404, { message: "User not found" });
  }

  await db
    .update(userTable)
    .set({
      avatarBlob: null,
      avatarMimeType: null,
      avatarUpdatedAt: null,
      image: null,
    })
    .where(eq(userTable.id, userId));
}

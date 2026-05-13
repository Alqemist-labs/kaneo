import { eq } from "drizzle-orm";
import db from "../../database";
import { userTable, workspaceUserTable } from "../../database/schema";
import { resolveUserDisplayImageUrl } from "../../utils/user-display-image";

async function getWorkspaceMembers(workspaceId: string) {
  const members = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
      image: userTable.image,
      avatarUpdatedAt: userTable.avatarUpdatedAt,
      role: workspaceUserTable.role,
    })
    .from(workspaceUserTable)
    .innerJoin(userTable, eq(workspaceUserTable.userId, userTable.id))
    .where(eq(workspaceUserTable.workspaceId, workspaceId));

  return members.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    image: resolveUserDisplayImageUrl({
      id: m.id,
      email: m.email,
      image: m.image,
      avatarUpdatedAt: m.avatarUpdatedAt,
    }),
    role: m.role,
  }));
}

export default getWorkspaceMembers;

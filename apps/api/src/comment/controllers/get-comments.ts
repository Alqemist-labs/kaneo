import { asc, eq } from "drizzle-orm";
import db from "../../database";
import { commentTable, userTable } from "../../database/schema";
import { resolveUserDisplayImageUrl } from "../../utils/user-display-image";

async function getComments(taskId: string) {
  const comments = await db
    .select({
      id: commentTable.id,
      taskId: commentTable.taskId,
      userId: commentTable.userId,
      content: commentTable.content,
      createdAt: commentTable.createdAt,
      updatedAt: commentTable.updatedAt,
      userName: userTable.name,
      userEmail: userTable.email,
      userImage: userTable.image,
      userAvatarUpdatedAt: userTable.avatarUpdatedAt,
    })
    .from(commentTable)
    .leftJoin(userTable, eq(commentTable.userId, userTable.id))
    .where(eq(commentTable.taskId, taskId))
    .orderBy(asc(commentTable.createdAt));

  return comments.map((c) => ({
    id: c.id,
    taskId: c.taskId,
    userId: c.userId,
    content: c.content,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    user: {
      name: c.userName ?? "",
      image:
        c.userId && c.userEmail
          ? resolveUserDisplayImageUrl({
              id: c.userId,
              email: c.userEmail,
              image: c.userImage,
              avatarUpdatedAt: c.userAvatarUpdatedAt,
            })
          : null,
    },
  }));
}

export default getComments;

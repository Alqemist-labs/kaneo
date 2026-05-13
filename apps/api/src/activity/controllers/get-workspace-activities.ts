import { desc, eq } from "drizzle-orm";
import db from "../../database";
import { activityTable, projectTable, taskTable } from "../../database/schema";

type GetWorkspaceActivitiesOptions = {
  limit: number;
  offset: number;
};

export default async function getWorkspaceActivities(
  workspaceId: string,
  options: GetWorkspaceActivitiesOptions,
) {
  const { limit, offset } = options;

  const rows = await db
    .select({
      id: activityTable.id,
      taskId: activityTable.taskId,
      type: activityTable.type,
      createdAt: activityTable.createdAt,
      updatedAt: activityTable.updatedAt,
      userId: activityTable.userId,
      content: activityTable.content,
      eventData: activityTable.eventData,
      externalUserName: activityTable.externalUserName,
      externalUserAvatar: activityTable.externalUserAvatar,
      externalSource: activityTable.externalSource,
      externalUrl: activityTable.externalUrl,
      taskTitle: taskTable.title,
      taskNumber: taskTable.number,
      projectId: projectTable.id,
      projectName: projectTable.name,
      projectSlug: projectTable.slug,
    })
    .from(activityTable)
    .innerJoin(taskTable, eq(activityTable.taskId, taskTable.id))
    .innerJoin(projectTable, eq(taskTable.projectId, projectTable.id))
    .where(eq(projectTable.workspaceId, workspaceId))
    .orderBy(desc(activityTable.createdAt))
    .limit(limit)
    .offset(offset);

  return rows.map((row) => {
    let content = row.content;
    if (content) {
      content = content.replace(/\n+/g, "\n");
    }

    return {
      id: row.id,
      taskId: row.taskId,
      type: row.type,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      userId: row.userId,
      content,
      eventData: row.eventData,
      externalUserName: row.externalUserName,
      externalUserAvatar: row.externalUserAvatar,
      externalSource: row.externalSource,
      externalUrl: row.externalUrl,
      task: {
        id: row.taskId,
        title: row.taskTitle,
        number: row.taskNumber,
      },
      project: {
        id: row.projectId,
        name: row.projectName,
        slug: row.projectSlug,
      },
    };
  });
}

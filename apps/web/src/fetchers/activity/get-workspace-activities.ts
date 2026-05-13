import { client } from "@kaneo/libs";

export type WorkspaceActivityFeedItem = {
  id: string;
  taskId: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  userId: string | null;
  content: string | null;
  eventData: unknown;
  externalUserName: string | null;
  externalUserAvatar: string | null;
  externalSource: string | null;
  externalUrl: string | null;
  task: { id: string; title: string; number: number | null };
  project: { id: string; name: string; slug: string };
};

const PAGE_SIZE = 18;

export async function getWorkspaceActivities({
  workspaceId,
  limit = PAGE_SIZE,
  offset = 0,
}: {
  workspaceId: string;
  limit?: number;
  offset?: number;
}): Promise<WorkspaceActivityFeedItem[]> {
  const response = await client.activity.workspace[":workspaceId"].$get({
    param: { workspaceId },
    query: { limit: String(limit), offset: String(offset) },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export const workspaceActivitiesPageSize = PAGE_SIZE;

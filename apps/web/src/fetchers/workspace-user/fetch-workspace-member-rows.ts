import { client } from "@kaneo/libs";

/** Matches consumers that previously used Better Auth `listMembers` rows. */
export type WorkspaceMemberRow = {
  userId: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
};

type KaneoWorkspaceMember = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
};

/**
 * Workspace members with display image URLs resolved by the API (Gravatar,
 * uploaded avatar route, or stored external image).
 */
export async function fetchWorkspaceMemberRows(
  workspaceId: string,
): Promise<WorkspaceMemberRow[]> {
  const response = await client.workspace[":workspaceId"].members.$get({
    param: { workspaceId },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to fetch workspace members");
  }

  const members = (await response.json()) as KaneoWorkspaceMember[];

  return members.map((m) => ({
    userId: m.id,
    role: m.role,
    user: {
      id: m.id,
      name: m.name,
      email: m.email,
      image: m.image,
    },
  }));
}

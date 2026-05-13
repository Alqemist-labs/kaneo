import { fetchWorkspaceMemberRows } from "./fetch-workspace-member-rows";

export type GetActiveWorkspaceUsersRequest = {
  workspaceId: string;
};

async function getActiveWorkspaceUsers({
  workspaceId,
}: GetActiveWorkspaceUsersRequest) {
  const members = await fetchWorkspaceMemberRows(workspaceId);
  return { members };
}

export default getActiveWorkspaceUsers;

import { useQuery } from "@tanstack/react-query";
import { fetchWorkspaceMemberRows } from "@/fetchers/workspace-user/fetch-workspace-member-rows";
import { authClient } from "@/lib/auth-client";

type GetFullWorkspaceRequest = {
  workspaceId?: string;
  workspaceSlug?: string;
  membersLimit?: number;
};

function useGetFullWorkspace({
  workspaceId,
  workspaceSlug,
  membersLimit = 100,
}: GetFullWorkspaceRequest) {
  return useQuery({
    queryKey: ["workspace", "full", workspaceId || workspaceSlug],
    enabled: !!(workspaceId || workspaceSlug),
    queryFn: async () => {
      const { data, error } = await authClient.organization.getFullOrganization(
        {
          query: {
            organizationId: workspaceId,
            membersLimit,
          },
        },
      );

      if (error) {
        throw new Error(error.message || "Failed to get full workspace");
      }

      if (!data) {
        throw new Error("Failed to get full workspace");
      }

      if (!workspaceId || !data.members?.length) {
        return data;
      }

      const kaneoMembers = await fetchWorkspaceMemberRows(workspaceId);
      const imageByUserId = new Map(
        kaneoMembers.map((m) => [m.userId, m.user.image]),
      );

      return {
        ...data,
        members: data.members.map((m) => ({
          ...m,
          user: m.user
            ? {
                ...m.user,
                image: imageByUserId.get(m.userId) ?? m.user.image,
              }
            : m.user,
        })),
      };
    },
  });
}

export default useGetFullWorkspace;

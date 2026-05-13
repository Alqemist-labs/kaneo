import { useMemo } from "react";
import useAuth from "@/components/providers/auth-provider/hooks/use-auth";
import useActiveWorkspace from "@/hooks/queries/workspace/use-active-workspace";
import { useGetActiveWorkspaceUsers } from "@/hooks/queries/workspace-users/use-get-active-workspace-users";

export const useGetActiveWorkspaceUser = () => {
  const { user } = useAuth();
  const { data: workspace } = useActiveWorkspace();
  const workspaceId = workspace?.id ?? "";
  const query = useGetActiveWorkspaceUsers(workspaceId);

  const data = useMemo(
    () =>
      query.data?.members?.find((member) => member.userId === user?.id) ?? null,
    [query.data?.members, user?.id],
  );

  return {
    data,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
  };
};

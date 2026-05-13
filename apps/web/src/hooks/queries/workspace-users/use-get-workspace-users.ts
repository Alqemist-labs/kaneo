import { useQuery } from "@tanstack/react-query";
import { fetchWorkspaceMemberRows } from "@/fetchers/workspace-user/fetch-workspace-member-rows";

type GetWorkspaceUsersRequest = {
  workspaceId?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  filterField?: string;
  filterOperator?: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "contains";
  filterValue?: string;
  enabled?: boolean;
};

function useGetWorkspaceUsers({
  workspaceId,
  limit,
  offset,
  sortBy,
  sortDirection,
  filterField,
  filterOperator,
  filterValue,
  enabled = true,
}: GetWorkspaceUsersRequest) {
  return useQuery({
    queryKey: [
      "workspace-users",
      workspaceId,
      limit,
      offset,
      sortBy,
      sortDirection,
      filterField,
      filterOperator,
      filterValue,
    ],
    enabled: enabled && !!workspaceId,
    queryFn: () => fetchWorkspaceMemberRows(workspaceId as string),
  });
}

export default useGetWorkspaceUsers;

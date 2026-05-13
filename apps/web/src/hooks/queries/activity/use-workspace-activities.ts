import { useInfiniteQuery } from "@tanstack/react-query";
import {
  getWorkspaceActivities,
  workspaceActivitiesPageSize,
} from "@/fetchers/activity/get-workspace-activities";

export default function useWorkspaceActivities(workspaceId: string) {
  return useInfiniteQuery({
    queryKey: ["workspace-activities", workspaceId],
    queryFn: ({ pageParam }) =>
      getWorkspaceActivities({
        workspaceId,
        limit: workspaceActivitiesPageSize,
        offset: pageParam,
      }),
    staleTime: 45_000,
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastOffset) => {
      if (lastPage.length < workspaceActivitiesPageSize) {
        return undefined;
      }
      return lastOffset + workspaceActivitiesPageSize;
    },
  });
}

"use client";

import { Calendar } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ActivityFeedContext } from "@/components/activity";
import Activity from "@/components/activity";
import TaskDetailsSheet from "@/components/task/task-details-sheet";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Timeline } from "@/components/ui/timeline";
import useWorkspaceActivities from "@/hooks/queries/activity/use-workspace-activities";
import useGetWorkspaceUsers from "@/hooks/queries/workspace-users/use-get-workspace-users";
import { formatDateMedium } from "@/lib/format";
import { i18n } from "@/lib/i18n";

type WorkspaceActivityFeedProps = {
  workspaceId: string;
};

type FeedRow = ReturnType<typeof useWorkspaceActivities>["data"] extends
  | { pages: (infer P)[] }
  | undefined
  ? P extends ReadonlyArray<infer R>
    ? R
    : never
  : never;

function getDayKey(value: string) {
  const date = new Date(value);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).toISOString();
}

function getDayLabel(value: string) {
  const target = new Date(value);
  const targetDay = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );
  const today = new Date();
  const todayDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const diffDays = Math.round(
    (targetDay.getTime() - todayDay.getTime()) / (1000 * 60 * 60 * 24),
  );

  const locale = i18n.resolvedLanguage || i18n.language || "en-US";

  if (diffDays === 0 || diffDays === -1) {
    return new Intl.RelativeTimeFormat(locale, { numeric: "auto" })
      .format(diffDays, "day")
      .replace(/^./, (c) => c.toUpperCase());
  }

  return formatDateMedium(targetDay);
}

function FeedSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <div className="space-y-3 rounded-md border border-border bg-sidebar p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}

export function WorkspaceActivityFeed({
  workspaceId,
}: WorkspaceActivityFeedProps) {
  const { t } = useTranslation();
  const [sheet, setSheet] = useState<{
    projectId: string;
    taskId: string;
  } | null>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);

  const { data: workspaceMembers } = useGetWorkspaceUsers({
    workspaceId,
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    isError,
  } = useWorkspaceActivities(workspaceId);

  const activities = useMemo(() => data?.pages.flat() ?? [], [data]);

  const groups = useMemo(() => {
    const map = new Map<string, { label: string; rows: FeedRow[] }>();
    for (const row of activities) {
      const key = getDayKey(row.createdAt);
      const existing = map.get(key);
      if (existing) {
        existing.rows.push(row);
      } else {
        map.set(key, { label: getDayLabel(row.createdAt), rows: [row] });
      }
    }
    return Array.from(map.entries()).map(([key, value]) => ({ key, ...value }));
  }, [activities]);

  useEffect(() => {
    const el = loadMoreSentinelRef.current;
    if (!el || !hasNextPage) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (
          first?.isIntersecting &&
          hasNextPage &&
          !isFetchingNextPage &&
          !isPending
        ) {
          void fetchNextPage();
        }
      },
      { root: null, rootMargin: "120px", threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isPending]);

  if (isError) {
    return (
      <div className="rounded-md border border-border bg-sidebar p-4">
        <p className="text-muted-foreground text-sm">
          {t("activity:workspaceFeed.errorLoading")}
        </p>
      </div>
    );
  }

  const showInitialSkeleton = isPending && activities.length === 0;

  if (showInitialSkeleton) {
    return <FeedSkeleton />;
  }

  if (activities.length === 0) {
    return (
      <Empty className="rounded-md border border-border border-dashed bg-sidebar py-12">
        <EmptyHeader>
          <EmptyTitle>{t("activity:workspaceFeed.emptyTitle")}</EmptyTitle>
          <EmptyDescription>
            {t("activity:workspaceFeed.emptyDescription")}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {groups.map((group) => (
          <section key={group.key} className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5 px-1 mb-2">
              <Calendar className="size-3.5 shrink-0 text-muted-foreground/60" />
              <h2 className="text-sm font-semibold text-foreground">
                {group.label}
              </h2>
              <span className="rounded-full bg-muted/80 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground/60">
                {group.rows.length}
              </span>
            </div>
            <div className="rounded-lg border border-border/60 bg-sidebar/60 px-3 py-1">
              <Timeline>
                {group.rows.map((row, index) => {
                  const showConnector = index < group.rows.length - 1;

                  const feedContext: ActivityFeedContext = {
                    workspaceId,
                    projectId: row.project.id,
                    taskId: row.taskId,
                    projectName: row.project.name,
                    taskTitle: row.task.title,
                    taskNumber: row.task.number,
                    onOpenTask: () =>
                      setSheet({
                        projectId: row.project.id,
                        taskId: row.taskId,
                      }),
                    contentPreviewMaxLength: 200,
                    prominentTimeline: true,
                    unifiedFeedRow: true,
                  };

                  return (
                    <Activity
                      key={row.id}
                      activity={{
                        id: row.id,
                        type: row.type,
                        content: row.content,
                        eventData: row.eventData,
                        createdAt: row.createdAt,
                        userId: row.userId,
                        taskId: row.taskId,
                        externalUserName: row.externalUserName,
                        externalUserAvatar: row.externalUserAvatar,
                        externalSource: row.externalSource,
                        externalUrl: row.externalUrl,
                      }}
                      step={group.rows.length - index}
                      showConnector={showConnector}
                      feedContext={feedContext}
                      workspaceMembers={workspaceMembers}
                    />
                  );
                })}
              </Timeline>
            </div>
          </section>
        ))}

        <div ref={loadMoreSentinelRef} className="h-1 w-full shrink-0" />

        {isFetchingNextPage ? (
          <div className="flex justify-center py-2">
            <Skeleton className="h-8 w-32" />
          </div>
        ) : null}

        {hasNextPage && !isFetchingNextPage ? (
          <Button
            variant="outline"
            size="sm"
            className="self-center"
            type="button"
            onClick={() => fetchNextPage()}
          >
            {t("activity:workspaceFeed.loadMore")}
          </Button>
        ) : null}
      </div>

      {sheet ? (
        <TaskDetailsSheet
          taskId={sheet.taskId}
          projectId={sheet.projectId}
          workspaceId={workspaceId}
          onClose={() => setSheet(null)}
        />
      ) : null}
    </>
  );
}

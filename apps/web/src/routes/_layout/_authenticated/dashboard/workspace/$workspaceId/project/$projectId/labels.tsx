import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import BoardToolbar from "@/components/board/board-toolbar";
import ProjectLayout from "@/components/common/project-layout";
import PageTitle from "@/components/page-title";
import ProjectLabelsStatusTable from "@/components/project/project-labels-status-table";
import TaskDetailsSheet from "@/components/task/task-details-sheet";
import { shortcuts } from "@/constants/shortcuts";
import useGetLabelsByWorkspace from "@/hooks/queries/label/use-get-labels-by-workspace";
import { useGetTasks } from "@/hooks/queries/task/use-get-tasks";
import { useGetActiveWorkspaceUsers } from "@/hooks/queries/workspace-users/use-get-active-workspace-users";
import { useRegisterShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useTaskFiltersWithLabelsSupport } from "@/hooks/use-task-filters-with-labels-support";
import { collectProjectTasks } from "@/lib/project-label-status-stats";
import type { SortConfig } from "@/lib/sort-tasks";
import useProjectStore from "@/store/project";
import { useUserPreferencesStore } from "@/store/user-preferences";

type LabelsSearchParams = {
  taskId?: string;
};

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/project/$projectId/labels",
)({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>): LabelsSearchParams => ({
    taskId: typeof search.taskId === "string" ? search.taskId : undefined,
  }),
});

function RouteComponent() {
  const { t } = useTranslation();
  const { projectId, workspaceId } = Route.useParams();
  const { taskId } = Route.useSearch();
  const navigate = useNavigate();
  const { data } = useGetTasks(projectId);
  const { project, setProject } = useProjectStore();
  const { setViewMode, viewMode } = useUserPreferencesStore();
  const { data: workspaceLabels = [] } = useGetLabelsByWorkspace(workspaceId);
  const { data: users } = useGetActiveWorkspaceUsers(workspaceId);

  const [sort] = useState<SortConfig>({
    field: "position",
    direction: "asc",
  });

  const {
    filters,
    updateFilter,
    updateLabelFilter,
    filteredProject,
    hasActiveFilters,
    clearFilters,
  } = useTaskFiltersWithLabelsSupport(project, projectId);

  const uniqueLabels = useMemo(
    () =>
      workspaceLabels.reduce(
        (
          acc: { id: string; name: string; color: string }[],
          label: { id: string; name: string; color: string },
        ) => {
          const existing = acc.find(
            (l) => l.name === label.name && l.color === label.color,
          );
          if (!existing) {
            acc.push(label);
          }
          return acc;
        },
        [],
      ),
    [workspaceLabels],
  );

  useEffect(() => {
    if (data) {
      setProject(data);
    }
  }, [data, setProject]);

  const handleCloseTaskSheet = useCallback(() => {
    navigate({
      to: ".",
      search: {},
      replace: true,
    });
  }, [navigate]);

  useRegisterShortcuts({
    sequentialShortcuts: {
      [shortcuts.view.prefix]: {
        [shortcuts.view.board]: () => {
          setViewMode("board");
          navigate({
            to: "/dashboard/workspace/$workspaceId/project/$projectId/board",
            params: { workspaceId, projectId },
          });
        },
        [shortcuts.view.list]: () => {
          setViewMode("list");
          navigate({
            to: "/dashboard/workspace/$workspaceId/project/$projectId/board",
            params: { workspaceId, projectId },
          });
        },
        [shortcuts.view.gantt]: () =>
          navigate({
            to: "/dashboard/workspace/$workspaceId/project/$projectId/gantt",
            params: { workspaceId, projectId },
          }),
        [shortcuts.view.backlog]: () =>
          navigate({
            to: "/dashboard/workspace/$workspaceId/project/$projectId/backlog",
            params: { workspaceId, projectId },
          }),
        [shortcuts.view.labels]: () => {},
      },
    },
  });

  const taskCount = useMemo(
    () =>
      filteredProject
        ? collectProjectTasks(filteredProject).length
        : project
          ? collectProjectTasks(project).length
          : 0,
    [filteredProject, project],
  );

  const tableProject = filteredProject ?? project ?? null;

  return (
    <ProjectLayout
      projectId={projectId}
      workspaceId={workspaceId}
      activeView="labels"
    >
      <PageTitle
        title={`${project?.name ?? ""} — ${t("tasks:labelsBreakdown.pageTitle")}`}
        hideAppName
      />
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
        {project ? (
          <BoardToolbar
            project={project}
            filters={filters}
            updateFilter={updateFilter}
            updateLabelFilter={updateLabelFilter}
            clearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
            users={users}
            workspaceLabels={workspaceLabels}
            viewMode={viewMode}
            setViewMode={setViewMode}
            sort={sort}
            onSortChange={() => {}}
            showSort={false}
            showDisplayModeToggle={false}
          />
        ) : null}
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-4">
          <p className="shrink-0 text-xs text-muted-foreground">
            {t("tasks:labelsBreakdown.summary", { count: taskCount })}
          </p>
          {tableProject ? (
            <ProjectLabelsStatusTable
              project={tableProject}
              uniqueLabels={uniqueLabels}
              workspaceLabels={workspaceLabels}
              activeLabelFilterIds={filters.labels}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("tasks:labelsBreakdown.loading")}
            </p>
          )}
        </div>
      </div>

      <TaskDetailsSheet
        taskId={taskId}
        projectId={projectId}
        workspaceId={workspaceId}
        onClose={handleCloseTaskSheet}
      />
    </ProjectLayout>
  );
}

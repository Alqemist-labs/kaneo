import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import ProjectLayout from "@/components/common/project-layout";
import PageTitle from "@/components/page-title";
import ProjectLabelsStatusTable from "@/components/project/project-labels-status-table";
import { ActiveFiltersBar } from "@/components/project/task-filters/active-filters-bar";
import { FilterMenu } from "@/components/project/task-filters/filter-menu";
import { useFilterShortcuts } from "@/components/project/task-filters/use-filter-shortcuts";
import { ProjectSearch } from "@/components/project/toolbar/project-search";
import { TaskCount } from "@/components/project/toolbar/task-count";
import { useProjectTaskView } from "@/components/project/toolbar/use-project-task-view";
import TaskDetailsSheet from "@/components/task/task-details-sheet";
import useGetLabelsByWorkspace from "@/hooks/queries/label/use-get-labels-by-workspace";
import { useGetTasks } from "@/hooks/queries/task/use-get-tasks";
import { collectProjectTasks } from "@/lib/project-label-status-stats";
import useProjectStore from "@/store/project";

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
  const { data: workspaceLabels = [] } = useGetLabelsByWorkspace(workspaceId);
  const view = useProjectTaskView({
    project,
    projectId,
    workspaceId,
    scope: "board",
  });
  const { filters } = view;
  useFilterShortcuts(view.subjects, filters.clearFilters);

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

  const tableProject = filters.filteredProject ?? project ?? null;

  return (
    <ProjectLayout
      projectId={projectId}
      workspaceId={workspaceId}
      activeView="labels"
      toolbar={
        <>
          <ProjectSearch value={view.search} onChange={view.setSearch} />
          <FilterMenu
            subjects={view.subjects}
            activeCount={filters.activeFilterCount}
          />
        </>
      }
      summary={
        <TaskCount
          shown={tableProject ? collectProjectTasks(tableProject).length : 0}
          total={project ? collectProjectTasks(project).length : 0}
        />
      }
      filterBar={
        <ActiveFiltersBar
          subjects={view.subjects}
          onClear={filters.clearFilters}
          customFieldValues={filters.customFieldValues}
        />
      }
    >
      <PageTitle
        title={
          project
            ? `${project.name} / ${t("tasks:labelsBreakdown.pageTitle")}`
            : undefined
        }
      />
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-4">
        {tableProject ? (
          <ProjectLabelsStatusTable
            project={tableProject}
            uniqueLabels={uniqueLabels}
            workspaceLabels={workspaceLabels}
            activeLabelFilterIds={filters.filters.labels}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("tasks:labelsBreakdown.loading")}
          </p>
        )}
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

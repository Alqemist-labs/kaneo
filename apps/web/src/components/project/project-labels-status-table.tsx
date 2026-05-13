import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import labelColors from "@/constants/label-colors";
import {
  buildColumnIsFinalByStatusKey,
  buildStatusColumns,
  collectProjectTasks,
  countTasksWithLabelByStatus,
  countTasksWithLabelInClosedState,
  formatClosedProgressPercent,
  formatCountAndPercent,
  visibleUniqueLabelsForFilter,
} from "@/lib/project-label-status-stats";
import type { ProjectWithTasks } from "@/types/project";

type WorkspaceLabel = { id: string; name: string; color: string };

type ProjectLabelsStatusTableProps = {
  project: ProjectWithTasks;
  uniqueLabels: WorkspaceLabel[];
  workspaceLabels: WorkspaceLabel[];
  /** When set, only rows for labels included in this id list are shown (same ids as board filter). */
  activeLabelFilterIds: string[] | null | undefined;
};

export default function ProjectLabelsStatusTable({
  project,
  uniqueLabels,
  workspaceLabels,
  activeLabelFilterIds,
}: ProjectLabelsStatusTableProps) {
  const { t } = useTranslation();

  const visibleLabels = useMemo(
    () =>
      visibleUniqueLabelsForFilter(
        uniqueLabels,
        workspaceLabels,
        activeLabelFilterIds,
      ),
    [uniqueLabels, workspaceLabels, activeLabelFilterIds],
  );

  const statusColumns = useMemo(
    () =>
      buildStatusColumns(project, {
        planned: t("tasks:status.planned"),
        archived: t("tasks:status.archived"),
      }),
    [project, t],
  );

  const allTasks = useMemo(() => collectProjectTasks(project), [project]);

  const columnIsFinalByStatus = useMemo(
    () => buildColumnIsFinalByStatusKey(project),
    [project],
  );

  if (uniqueLabels.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("tasks:labelsBreakdown.noLabelsInWorkspace")}
      </p>
    );
  }

  if (visibleLabels.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("tasks:labelsBreakdown.noLabelsMatchFilter")}
      </p>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-border">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="sticky left-0 z-10 min-w-[12rem] border-r border-border bg-muted/40 px-3 py-2 text-left text-xs font-medium text-muted-foreground">
              {t("tasks:labelsBreakdown.labelColumn")}
            </th>
            {statusColumns.map((col) => (
              <th
                key={col.key}
                className="min-w-[6.5rem] px-2 py-2 text-center text-xs font-medium text-muted-foreground"
              >
                <span className="line-clamp-2">{col.name}</span>
              </th>
            ))}
            <th className="min-w-[5rem] border-l border-border px-2 py-2 text-center text-xs font-medium text-muted-foreground">
              {t("tasks:labelsBreakdown.rowTotal")}
            </th>
            <th className="min-w-[4.5rem] border-l border-border px-2 py-2 text-center text-xs font-medium text-muted-foreground">
              {t("tasks:labelsBreakdown.progressColumn")}
            </th>
          </tr>
        </thead>
        <tbody>
          {visibleLabels.map((label) => {
            const dotColor =
              labelColors.find((c) => c.value === label.color)?.color ||
              "var(--color-neutral-400)";
            const rowTotal = allTasks.filter((task) =>
              task.labels?.some(
                (l) => l.name === label.name && l.color === label.color,
              ),
            ).length;
            const closedCount = countTasksWithLabelInClosedState(
              allTasks,
              label.name,
              label.color,
              columnIsFinalByStatus,
            );

            return (
              <tr
                key={`${label.name}-${label.color}-${label.id}`}
                className="border-b border-border/80"
              >
                <td className="sticky left-0 z-[1] border-r border-border bg-background px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2 leading-snug">
                    <span
                      className="size-2 shrink-0 translate-y-px self-center rounded-full"
                      style={{ backgroundColor: dotColor }}
                    />
                    <span className="min-w-0 break-words font-medium text-foreground">
                      {label.name}
                    </span>
                  </div>
                </td>
                {statusColumns.map((col) => {
                  const count = countTasksWithLabelByStatus(
                    allTasks,
                    label.name,
                    label.color,
                    col.key,
                  );
                  return (
                    <td
                      key={col.key}
                      className="px-2 py-2 text-center text-xs tabular-nums text-foreground/90"
                    >
                      {formatCountAndPercent(count, rowTotal)}
                    </td>
                  );
                })}
                <td className="border-l border-border px-2 py-2 text-center text-xs font-medium tabular-nums">
                  {rowTotal}
                </td>
                <td className="border-l border-border px-2 py-2 text-center text-xs tabular-nums text-foreground/90">
                  {formatClosedProgressPercent(closedCount, rowTotal)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

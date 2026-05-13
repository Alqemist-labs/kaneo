import type { ProjectWithTasks } from "@/types/project";
import type Task from "@/types/task";

export type StatusColumnMeta = {
  key: string;
  name: string;
};

export function collectProjectTasks(project: ProjectWithTasks): Task[] {
  return [
    ...project.columns.flatMap((c) => c.tasks),
    ...project.plannedTasks,
    ...project.archivedTasks,
  ];
}

export function buildStatusColumns(
  project: ProjectWithTasks,
  labels: { planned: string; archived: string },
): StatusColumnMeta[] {
  const cols: StatusColumnMeta[] = project.columns.map((c) => ({
    key: c.slug ?? c.id,
    name: c.name,
  }));
  cols.push(
    { key: "planned", name: labels.planned },
    { key: "archived", name: labels.archived },
  );
  return cols;
}

export function taskMatchesLabel(
  task: Task,
  name: string,
  color: string,
): boolean {
  return (
    task.labels?.some((l) => l.name === name && l.color === color) ?? false
  );
}

export function countTasksWithLabelByStatus(
  tasks: Task[],
  labelName: string,
  labelColor: string,
  statusKey: string,
): number {
  return tasks.filter(
    (t) => t.status === statusKey && taskMatchesLabel(t, labelName, labelColor),
  ).length;
}

export function formatCountAndPercent(count: number, total: number): string {
  if (count === 0) {
    return "-";
  }
  if (total <= 0) {
    return `${count} (—)`;
  }
  const pct = Math.round((count / total) * 1000) / 10;
  const pctStr = Number.isInteger(pct) ? `${pct}` : pct.toFixed(1);
  return `${count} (${pctStr}%)`;
}

/** Maps board column status keys (slug/id) to whether the column is marked "finished" in project settings. */
export function buildColumnIsFinalByStatusKey(
  project: ProjectWithTasks,
): Map<string, boolean> {
  const map = new Map<string, boolean>();
  for (const col of project.columns) {
    const slug = col.slug ?? col.id;
    const fin = Boolean(col.isFinal);
    map.set(slug, fin);
    if (col.id && col.id !== slug) {
      map.set(col.id, fin);
    }
  }
  return map;
}

/**
 * Closed = archived, or status in a column with "finished column" (isFinal).
 * Planned backlog is treated as open.
 */
export function isTaskInClosedState(
  task: Task,
  columnIsFinalByStatus: Map<string, boolean>,
): boolean {
  if (task.status === "archived") {
    return true;
  }
  if (task.status === "planned") {
    return false;
  }
  return columnIsFinalByStatus.get(task.status) === true;
}

export function countTasksWithLabelInClosedState(
  tasks: Task[],
  labelName: string,
  labelColor: string,
  columnIsFinalByStatus: Map<string, boolean>,
): number {
  return tasks.filter(
    (t) =>
      taskMatchesLabel(t, labelName, labelColor) &&
      isTaskInClosedState(t, columnIsFinalByStatus),
  ).length;
}

/** Share of closed tasks among `total` (0–100 %), for the progress column. */
export function formatClosedProgressPercent(
  closed: number,
  total: number,
): string {
  if (total <= 0) {
    return "-";
  }
  const pct = Math.round((closed / total) * 1000) / 10;
  const pctStr = Number.isInteger(pct) ? `${pct}` : pct.toFixed(1);
  return `${pctStr}%`;
}

type LabelRow = { id: string; name: string; color: string };

/** Keeps only unique label rows whose workspace ids intersect the board label filter. */
export function visibleUniqueLabelsForFilter(
  uniqueLabels: LabelRow[],
  workspaceLabels: LabelRow[],
  activeLabelFilterIds: string[] | null | undefined,
): LabelRow[] {
  if (!activeLabelFilterIds?.length) {
    return uniqueLabels;
  }
  const selected = new Set(activeLabelFilterIds);
  return uniqueLabels.filter((ul) =>
    workspaceLabels.some(
      (l) => l.name === ul.name && l.color === ul.color && selected.has(l.id),
    ),
  );
}

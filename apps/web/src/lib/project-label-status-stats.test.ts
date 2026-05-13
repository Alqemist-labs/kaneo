import { describe, expect, it } from "vitest";
import type { ProjectWithTasks } from "@/types/project";
import type Task from "@/types/task";
import {
  buildColumnIsFinalByStatusKey,
  countTasksWithLabelByStatus,
  countTasksWithLabelInClosedState,
  formatClosedProgressPercent,
  formatCountAndPercent,
  isTaskInClosedState,
  taskMatchesLabel,
  visibleUniqueLabelsForFilter,
} from "./project-label-status-stats";

describe("formatCountAndPercent", () => {
  it("affiche le pourcentage arrondi à une décimale", () => {
    expect(formatCountAndPercent(1, 3)).toBe("1 (33.3%)");
  });

  it("affiche un entier quand c’est un pourcentage rond", () => {
    expect(formatCountAndPercent(2, 4)).toBe("2 (50%)");
  });

  it("utilise un tire quand le total de ligne est nul mais le compte non nul", () => {
    expect(formatCountAndPercent(3, 0)).toBe("3 (—)");
  });

  it("affiche un tire seul quand le compte est zéro", () => {
    expect(formatCountAndPercent(0, 0)).toBe("-");
    expect(formatCountAndPercent(0, 5)).toBe("-");
  });
});

describe("taskMatchesLabel", () => {
  const task: Task = {
    id: "t1",
    title: "x",
    number: 1,
    description: null,
    status: "to-do",
    priority: null,
    startDate: null,
    dueDate: null,
    position: 0,
    createdAt: new Date().toISOString(),
    userId: null,
    assigneeId: null,
    assigneeName: null,
    projectId: "p1",
    labels: [
      { id: "l1", name: "bug", color: "red" },
      { id: "l2", name: "frontend", color: "yellow" },
    ],
  };

  it("retourne true si nom et couleur correspondent", () => {
    expect(taskMatchesLabel(task, "bug", "red")).toBe(true);
  });

  it("retourne false si la couleur ne correspond pas", () => {
    expect(taskMatchesLabel(task, "bug", "green")).toBe(false);
  });
});

describe("countTasksWithLabelByStatus", () => {
  const mk = (status: string, labels: Task["labels"]): Task => ({
    id: status,
    title: status,
    number: 1,
    description: null,
    status,
    priority: null,
    startDate: null,
    dueDate: null,
    position: 0,
    createdAt: new Date().toISOString(),
    userId: null,
    assigneeId: null,
    assigneeName: null,
    projectId: "p1",
    labels,
  });

  const tasks: Task[] = [
    mk("to-do", [{ id: "1", name: "a", color: "gray" }]),
    mk("to-do", [{ id: "2", name: "a", color: "gray" }]),
    mk("done", [{ id: "3", name: "a", color: "gray" }]),
  ];

  it("compte par statut pour un label donné", () => {
    expect(countTasksWithLabelByStatus(tasks, "a", "gray", "to-do")).toBe(2);
    expect(countTasksWithLabelByStatus(tasks, "a", "gray", "done")).toBe(1);
    expect(countTasksWithLabelByStatus(tasks, "a", "gray", "planned")).toBe(0);
  });
});

describe("visibleUniqueLabelsForFilter", () => {
  const unique = [
    { id: "u1", name: "A", color: "red" },
    { id: "u2", name: "B", color: "blue" },
  ];
  const workspace = [
    { id: "w1", name: "A", color: "red" },
    { id: "w2", name: "A", color: "red" },
    { id: "w3", name: "B", color: "blue" },
  ];

  it("retourne tous les labels uniques si aucun filtre", () => {
    expect(visibleUniqueLabelsForFilter(unique, workspace, null)).toEqual(
      unique,
    );
    expect(visibleUniqueLabelsForFilter(unique, workspace, [])).toEqual(unique);
  });

  it("ne garde que les lignes dont un id workspace est sélectionné", () => {
    expect(visibleUniqueLabelsForFilter(unique, workspace, ["w3"])).toEqual([
      { id: "u2", name: "B", color: "blue" },
    ]);
  });

  it("associe la sélection à un groupe nom+couleur", () => {
    expect(visibleUniqueLabelsForFilter(unique, workspace, ["w2"])).toEqual([
      { id: "u1", name: "A", color: "red" },
    ]);
  });
});

describe("formatClosedProgressPercent", () => {
  it("affiche le pourcentage fermé / total", () => {
    expect(formatClosedProgressPercent(1, 4)).toBe("25%");
    expect(formatClosedProgressPercent(3, 4)).toBe("75%");
  });

  it("retourne un tire si total zéro", () => {
    expect(formatClosedProgressPercent(0, 0)).toBe("-");
    expect(formatClosedProgressPercent(2, 0)).toBe("-");
  });
});

describe("isTaskInClosedState", () => {
  const columnMap = new Map<string, boolean>([
    ["done", true],
    ["to-do", false],
  ]);

  const baseTask = (): Omit<Task, "status"> => ({
    id: "t1",
    title: "x",
    number: 1,
    description: null,
    priority: null,
    startDate: null,
    dueDate: null,
    position: 0,
    createdAt: new Date().toISOString(),
    userId: null,
    assigneeId: null,
    assigneeName: null,
    projectId: "p1",
    labels: [],
  });

  it("traite archived comme fermé", () => {
    expect(
      isTaskInClosedState({ ...baseTask(), status: "archived" }, columnMap),
    ).toBe(true);
  });

  it("traite planned comme ouvert", () => {
    expect(
      isTaskInClosedState({ ...baseTask(), status: "planned" }, columnMap),
    ).toBe(false);
  });

  it("utilise isFinal des colonnes", () => {
    expect(
      isTaskInClosedState({ ...baseTask(), status: "done" }, columnMap),
    ).toBe(true);
    expect(
      isTaskInClosedState({ ...baseTask(), status: "to-do" }, columnMap),
    ).toBe(false);
  });
});

describe("buildColumnIsFinalByStatusKey", () => {
  it("expose slug et id", () => {
    const project = {
      columns: [
        {
          id: "done",
          slug: "done",
          name: "Done",
          isFinal: true,
          tasks: [],
        },
        {
          id: "to-do",
          slug: "to-do",
          name: "To Do",
          isFinal: false,
          tasks: [],
        },
      ],
    } as unknown as ProjectWithTasks;

    const map = buildColumnIsFinalByStatusKey(project);
    expect(map.get("done")).toBe(true);
    expect(map.get("to-do")).toBe(false);
  });
});

describe("countTasksWithLabelInClosedState", () => {
  const columnMap = new Map<string, boolean>([
    ["done", true],
    ["to-do", false],
  ]);

  const mk = (status: string, labels: Task["labels"]): Task => ({
    id: status,
    title: status,
    number: 1,
    description: null,
    status,
    priority: null,
    startDate: null,
    dueDate: null,
    position: 0,
    createdAt: new Date().toISOString(),
    userId: null,
    assigneeId: null,
    assigneeName: null,
    projectId: "p1",
    labels,
  });

  const tasks: Task[] = [
    mk("to-do", [{ id: "1", name: "a", color: "gray" }]),
    mk("done", [{ id: "2", name: "a", color: "gray" }]),
    mk("archived", [{ id: "3", name: "a", color: "gray" }]),
  ];

  it("compte les tâches avec le label dans un état fermé", () => {
    expect(
      countTasksWithLabelInClosedState(tasks, "a", "gray", columnMap),
    ).toBe(2);
  });
});

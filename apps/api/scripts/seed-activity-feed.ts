/**
 * Local-only seed: populates a target project with 30 fake tasks spread over
 * the last ~6 weeks and a mix of backdated activity events (status changes,
 * priority changes, assignments, comments, due-date changes, title edits) so
 * the workspace activity feed has enough varied data to look at.
 *
 * Usage:
 *   pnpm --filter @kaneo/api seed:activity-feed
 *
 * Override targets via env vars:
 *   SEED_WORKSPACE_ID, SEED_PROJECT_ID, SEED_USER_ID
 */
import { createId } from "@paralleldrive/cuid2";
import { and, asc, eq, sql } from "drizzle-orm";
import db from "../src/database";
import {
  activityTable,
  columnTable,
  projectTable,
  taskTable,
  userTable,
  workspaceUserTable,
} from "../src/database/schema";

const TASK_COUNT = 30;

const TASK_TITLES = [
  "Set up onboarding checklist",
  "Refactor authentication middleware",
  "Improve mobile navigation menu",
  "Fix flaky e2e test on CI",
  "Add CSV import for tasks",
  "Investigate slow board query",
  "Polish project settings layout",
  "Add empty state for activity feed",
  "Migrate legacy webhook payloads",
  "Document SSO configuration",
  "Localize date pickers",
  "Add dark mode to docs site",
  "Audit accessibility on kanban",
  "Reduce cold-start of API",
  "Cache workspace member queries",
  "Replace toast library on web",
  "Add keyboard shortcut for search",
  "Bulk archive done tickets",
  "Sync labels with GitHub",
  "Add invitation reminder emails",
  "Switch to streaming uploads",
  "Trim large image attachments",
  "Polish Gantt zoom controls",
  "Hover preview on user mentions",
  "Add export-to-PDF for tasks",
  "Resolve calendar timezone bug",
  "Improve error message on 401",
  "Wire up Slack notifications",
  "Audit Tailwind purge config",
  "Add backlog filter chips",
];

const STATUSES = ["to-do", "in-progress", "in-review", "done"] as const;
const PRIORITIES = ["no-priority", "low", "medium", "high", "urgent"] as const;
const COMMENTS = [
  "Looks good, shipping after review.",
  "I’ll pick this up tomorrow morning.",
  "Need design input before continuing.",
  "Can we split this into smaller subtasks?",
  "Blocked on the API change in #1.",
  "Reproduced locally, working on a fix.",
  "Approved, merging shortly.",
  "Pinging the team for visibility.",
];

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(items: readonly T[]): T {
  return items[randInt(0, items.length - 1)];
}

function daysAgo(d: number, hour = 9, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() - d);
  date.setHours(hour, minute, 0, 0);
  return date;
}

async function resolveTargets() {
  const explicitProjectId = process.env.SEED_PROJECT_ID;
  const explicitUserId = process.env.SEED_USER_ID;

  let project: { id: string; workspaceId: string } | undefined;
  if (explicitProjectId) {
    const [row] = await db
      .select({ id: projectTable.id, workspaceId: projectTable.workspaceId })
      .from(projectTable)
      .where(eq(projectTable.id, explicitProjectId))
      .limit(1);
    project = row;
  } else {
    const targetWorkspaceId = process.env.SEED_WORKSPACE_ID;
    const [row] = targetWorkspaceId
      ? await db
          .select({
            id: projectTable.id,
            workspaceId: projectTable.workspaceId,
          })
          .from(projectTable)
          .where(eq(projectTable.workspaceId, targetWorkspaceId))
          .limit(1)
      : await db
          .select({
            id: projectTable.id,
            workspaceId: projectTable.workspaceId,
          })
          .from(projectTable)
          .limit(1);
    project = row;
  }

  if (!project) {
    throw new Error("No project found. Set SEED_PROJECT_ID.");
  }

  const userId =
    explicitUserId ??
    (
      await db
        .select({ userId: workspaceUserTable.userId })
        .from(workspaceUserTable)
        .where(eq(workspaceUserTable.workspaceId, project.workspaceId))
        .limit(1)
    )[0]?.userId ??
    (await db.select({ id: userTable.id }).from(userTable).limit(1))[0]?.id;

  if (!userId) {
    throw new Error("No user found. Set SEED_USER_ID.");
  }

  const columns = await db
    .select({
      id: columnTable.id,
      slug: columnTable.slug,
      isFinal: columnTable.isFinal,
    })
    .from(columnTable)
    .where(eq(columnTable.projectId, project.id))
    .orderBy(asc(columnTable.position));

  if (columns.length === 0) {
    throw new Error(`Project ${project.id} has no columns.`);
  }

  return { project, userId, columns };
}

async function nextTaskNumber(projectId: string) {
  const [row] = await db
    .select({ value: sql<number>`coalesce(max(${taskTable.number}), 0)` })
    .from(taskTable)
    .where(eq(taskTable.projectId, projectId));
  return (row?.value ?? 0) + 1;
}

async function nextTaskPosition(projectId: string, columnId: string) {
  const [row] = await db
    .select({ value: sql<number>`coalesce(max(${taskTable.position}), -1)` })
    .from(taskTable)
    .where(
      and(eq(taskTable.projectId, projectId), eq(taskTable.columnId, columnId)),
    );
  return (row?.value ?? -1) + 1;
}

async function main() {
  const { project, userId, columns } = await resolveTargets();
  const finalColumn =
    columns.find((c) => c.isFinal) ?? columns[columns.length - 1];

  console.log(
    `Seeding activity into project ${project.id} (workspace ${project.workspaceId}) as user ${userId}…`,
  );

  let nextNumber = await nextTaskNumber(project.id);

  for (let i = 0; i < TASK_COUNT; i++) {
    const title = TASK_TITLES[i % TASK_TITLES.length];
    const statusIndex = randInt(0, STATUSES.length - 1);
    const status = STATUSES[statusIndex];
    const column =
      columns.find((c) => c.slug === status) ??
      (status === "done" ? finalColumn : columns[0]);
    const priority = pick(PRIORITIES);

    const createdAt = daysAgo(randInt(0, 42), randInt(8, 18), randInt(0, 59));
    const taskId = createId();
    const position = await nextTaskPosition(project.id, column.id);

    await db.insert(taskTable).values({
      id: taskId,
      projectId: project.id,
      number: nextNumber++,
      position,
      title,
      description: null,
      status,
      columnId: column.id,
      priority,
      userId: Math.random() < 0.4 ? userId : null,
      createdAt,
      updatedAt: createdAt,
    });

    const events: Array<{
      type: string;
      createdAt: Date;
      content: string | null;
      eventData: Record<string, unknown> | null;
    }> = [];

    events.push({
      type: "created",
      createdAt,
      content: null,
      eventData: {},
    });

    let cursor = createdAt.getTime();
    const horizon = Date.now();

    function nextEventDate() {
      const minStep = 30 * 60 * 1000;
      const maxStep = 36 * 60 * 60 * 1000;
      cursor = Math.min(horizon, cursor + randInt(minStep, maxStep));
      return new Date(cursor);
    }

    if (Math.random() < 0.85) {
      const newPriority = pick(PRIORITIES.filter((p) => p !== priority));
      events.push({
        type: "priority_changed",
        createdAt: nextEventDate(),
        content: null,
        eventData: { oldPriority: priority, newPriority },
      });
    }

    if (statusIndex >= 1 && Math.random() < 0.9) {
      events.push({
        type: "status_changed",
        createdAt: nextEventDate(),
        content: null,
        eventData: { oldStatus: STATUSES[0], newStatus: STATUSES[1] },
      });
    }
    if (statusIndex >= 2 && Math.random() < 0.7) {
      events.push({
        type: "status_changed",
        createdAt: nextEventDate(),
        content: null,
        eventData: { oldStatus: STATUSES[1], newStatus: STATUSES[2] },
      });
    }
    if (statusIndex === 3) {
      events.push({
        type: "status_changed",
        createdAt: nextEventDate(),
        content: null,
        eventData: { oldStatus: STATUSES[2], newStatus: STATUSES[3] },
      });
    }

    if (Math.random() < 0.5) {
      events.push({
        type: "assignee_changed",
        createdAt: nextEventDate(),
        content: null,
        eventData: {
          newAssigneeId: userId,
          newAssignee: "Florian",
          isSelfAssigned: true,
        },
      });
    }

    if (Math.random() < 0.4) {
      const newTitle = `${title} (rev)`;
      events.push({
        type: "title_changed",
        createdAt: nextEventDate(),
        content: null,
        eventData: { oldTitle: title, newTitle },
      });
    }

    if (Math.random() < 0.45) {
      const newDue = daysAgo(-randInt(1, 30));
      events.push({
        type: "due_date_changed",
        createdAt: nextEventDate(),
        content: null,
        eventData: {
          oldDueDate: null,
          newDueDate: newDue.toISOString(),
        },
      });
    }

    const commentCount = randInt(0, 3);
    for (let c = 0; c < commentCount; c++) {
      events.push({
        type: "comment",
        createdAt: nextEventDate(),
        content: pick(COMMENTS),
        eventData: null,
      });
    }

    for (const event of events) {
      await db.insert(activityTable).values({
        id: createId(),
        taskId,
        type: event.type,
        userId,
        content: event.content,
        eventData: event.eventData,
        createdAt: event.createdAt,
        updatedAt: event.createdAt,
      });
    }
  }

  console.log(`Seed complete: ${TASK_COUNT} tasks added.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

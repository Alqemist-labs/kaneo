import { z } from "../openapi";

export const taskIdParam = z.object({ taskId: z.string() });

export const createActivityBody = z.object({
  taskId: z.string(),
  message: z.string().nullable().openapi({
    description:
      "Free-text body. Null for events whose meaning is in eventData.",
  }),
  type: z.string().openapi({
    description: "The event kind, e.g. status_changed or assignee_changed.",
  }),
  eventData: z.record(z.string(), z.unknown()).nullable().optional().openapi({
    description: "Type-specific payload stored alongside the event.",
  }),
});

export const createCommentBody = z.object({
  taskId: z.string(),
  comment: z.string(),
});

export const updateCommentBody = z.object({
  activityId: z.string(),
  comment: z.string(),
});

export const deleteCommentBody = z.object({ activityId: z.string() });

export const workspaceIdParam = z.object({ workspaceId: z.string() });

const pagingNumber = (min: number, max: number) =>
  z
    .string()
    .regex(/^\d+$/, "Expected a positive integer")
    .transform(Number)
    .pipe(z.number().int().min(min).max(max));

export const workspaceActivitiesQuery = z.object({
  limit: pagingNumber(1, 100).optional(),
  offset: pagingNumber(0, 1_000_000).optional(),
});

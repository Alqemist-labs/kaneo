import {
  IconAlertCircle,
  IconArrowsRightLeft,
  IconBrandGithub,
  IconCalendar,
  IconFileDescription,
  IconHistory,
  IconMessageCircle,
  IconPencil,
  IconPlus,
  IconProgress,
  IconTag,
  IconUserMinus,
  IconUserPlus,
} from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import type { KeyboardEvent, MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import useActiveWorkspace from "@/hooks/queries/workspace/use-active-workspace";
import useGetWorkspaceUsers from "@/hooks/queries/workspace-users/use-get-workspace-users";
import { cn } from "@/lib/cn";
import {
  formatDateMedium,
  formatDateTime,
  formatRelativeTime,
  formatTimeOnly,
} from "@/lib/format";
import { getPriorityLabel, getStatusLabel } from "@/lib/i18n/domain";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/preview-card";
import { TimelineContent, TimelineItem } from "../ui/timeline";
import CommentCard from "./comment-card";
import { isCommentActivity, toCommentPlainPreview } from "./utils";

type ActivityItem = {
  type: string;
  content: string | null;
  eventData?: unknown;
  id: string;
  createdAt: string;
  userId: string | null;
  taskId: string;
  externalUserName?: string | null;
  externalUserAvatar?: string | null;
  externalSource?: string | null;
  externalUrl?: string | null;
};

export type ActivityFeedContext = {
  workspaceId: string;
  projectId: string;
  taskId: string;
  projectName: string;
  taskTitle: string;
  taskNumber: number | null;
  /** Opens task sheet (e.g. workspace activity) instead of navigating away */
  onOpenTask?: () => void;
  /** Truncate raw activity `content` fallback (descriptions, unknown types) */
  contentPreviewMaxLength?: number;
  /** Show calendar time + relative time on each row */
  prominentTimeline?: boolean;
  /** One timeline row style + row click opens task sheet (workspace feed) */
  unifiedFeedRow?: boolean;
};

function FeedTaskLink({ ctx }: { ctx: ActivityFeedContext }) {
  const taskLabel =
    ctx.taskNumber != null
      ? `#${ctx.taskNumber} ${ctx.taskTitle}`
      : ctx.taskTitle;

  const label = (
    <>
      <span className="font-medium text-foreground/90">{ctx.projectName}</span>
      <span className="mx-1 text-muted-foreground/50">·</span>
      <span>{taskLabel}</span>
    </>
  );

  if (ctx.unifiedFeedRow) {
    return (
      <span className="inline-flex flex-wrap items-baseline gap-x-1 text-xs text-muted-foreground/60">
        <span className="font-medium text-muted-foreground/80">
          {ctx.projectName}
        </span>
        <span className="text-muted-foreground/35">·</span>
        <span>{taskLabel}</span>
      </span>
    );
  }

  if (ctx.onOpenTask) {
    return (
      <button
        type="button"
        onClick={ctx.onOpenTask}
        className="mt-1 block w-full truncate text-start text-muted-foreground text-xs transition-colors hover:text-foreground"
      >
        {label}
      </button>
    );
  }

  return (
    <Link
      to="/dashboard/workspace/$workspaceId/project/$projectId/task/$taskId"
      params={{
        workspaceId: ctx.workspaceId,
        projectId: ctx.projectId,
        taskId: ctx.taskId,
      }}
      className="mt-1 block truncate text-start text-muted-foreground text-xs transition-colors hover:text-foreground"
    >
      {label}
    </Link>
  );
}

function getEventDataRecord(
  eventData: unknown,
): Record<string, unknown> | null {
  if (!eventData || typeof eventData !== "object" || Array.isArray(eventData)) {
    return null;
  }

  return eventData as Record<string, unknown>;
}

type WorkspaceUser = {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
};

function getActivityTypeIcon(activity: ActivityItem) {
  const iconClass = "size-2.5 shrink-0";
  const stroke = 2;

  if (activity.type === "comment" && activity.externalSource === "github") {
    return (
      <IconBrandGithub className={iconClass} stroke={stroke} aria-hidden />
    );
  }

  switch (activity.type) {
    case "comment":
      return (
        <IconMessageCircle className={iconClass} stroke={stroke} aria-hidden />
      );
    case "status_changed":
      return <IconProgress className={iconClass} stroke={stroke} aria-hidden />;
    case "priority_changed":
      return (
        <IconAlertCircle className={iconClass} stroke={stroke} aria-hidden />
      );
    case "due_date_changed":
      return <IconCalendar className={iconClass} stroke={stroke} aria-hidden />;
    case "assignee_changed":
      return <IconUserPlus className={iconClass} stroke={stroke} aria-hidden />;
    case "unassigned":
      return (
        <IconUserMinus className={iconClass} stroke={stroke} aria-hidden />
      );
    case "title_changed":
      return <IconPencil className={iconClass} stroke={stroke} aria-hidden />;
    case "moved":
      return (
        <IconArrowsRightLeft
          className={iconClass}
          stroke={stroke}
          aria-hidden
        />
      );
    case "created":
      return <IconPlus className={iconClass} stroke={stroke} aria-hidden />;
    case "description_changed":
      return (
        <IconFileDescription
          className={iconClass}
          stroke={stroke}
          aria-hidden
        />
      );
    case "label_assigned":
    case "label_unassigned":
      return <IconTag className={iconClass} stroke={stroke} aria-hidden />;
    default:
      return <IconHistory className={iconClass} stroke={stroke} aria-hidden />;
  }
}

function formatActivityDateText(value: string) {
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return formatDateMedium(parsed);
  }

  const slashMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!slashMatch) return value;
  const [, month, day, year] = slashMatch;
  const fromSlashDate = new Date(`${year}-${month}-${day}T00:00:00`);
  if (Number.isNaN(fromSlashDate.getTime())) return value;
  return formatDateMedium(fromSlashDate);
}

function toDisplayCase(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function findUserByName(users: WorkspaceUser[] | undefined, name: string) {
  if (!users) return null;
  const matches = users.filter(
    (member) =>
      member.user?.name?.toLowerCase().trim() === name.toLowerCase().trim(),
  );

  if (matches.length !== 1) return null;
  return matches[0];
}

function UserHoverName({
  user,
  fallbackName,
}: {
  user: WorkspaceUser | null;
  fallbackName: string;
}) {
  if (!user?.user) {
    return <span className="font-medium text-foreground">{fallbackName}</span>;
  }

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <span className="cursor-pointer font-medium text-foreground transition-colors hover:text-primary">
          {user.user.name}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-52 p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={user.user.image ?? ""}
              alt={user.user.name || ""}
            />
            <AvatarFallback className="bg-muted text-xs font-medium">
              {user.user.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground leading-none">
              {user.user.name}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {user.user.email}
            </p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

function ActorAvatar({
  user,
  fallbackName,
  imageSrc,
}: {
  user: WorkspaceUser | null;
  fallbackName: string;
  imageSrc?: string | null;
}) {
  const src = imageSrc || user?.user?.image || "";
  return (
    <Avatar className="size-6">
      <AvatarImage src={src} alt={fallbackName} />
      <AvatarFallback className="bg-muted text-[11px] font-medium">
        {fallbackName.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

function renderActivityContent({
  activity,
  workspaceUsers,
  t,
  contentPreviewMaxLength,
}: {
  activity: ActivityItem;
  workspaceUsers: WorkspaceUser[] | undefined;
  t: (key: string, options?: Record<string, unknown>) => string;
  contentPreviewMaxLength?: number;
}) {
  const content = activity.content || "";
  const eventData = getEventDataRecord(activity.eventData);

  if (activity.type === "priority_changed") {
    if (eventData) {
      return (
        <span className="text-sm text-muted-foreground">
          {t("activity:changedPriority", {
            from: getPriorityLabel(String(eventData.oldPriority ?? "")),
            to: getPriorityLabel(String(eventData.newPriority ?? "")),
          })}
        </span>
      );
    }

    const match = content.match(
      /changed priority from "?(.+?)"? to "?(.+?)"?$/i,
    );
    if (!match) {
      return <span className="text-sm text-muted-foreground">{content}</span>;
    }

    return (
      <span className="text-sm text-muted-foreground">
        {t("activity:changedPriority", {
          from: getPriorityLabel(match[1]),
          to: getPriorityLabel(match[2]),
        })}
      </span>
    );
  }

  if (activity.type === "status_changed") {
    if (eventData) {
      return (
        <span className="text-sm text-muted-foreground">
          {t("activity:changedStatus", {
            from: getStatusLabel(String(eventData.oldStatus ?? "")),
            to: getStatusLabel(String(eventData.newStatus ?? "")),
          })}
        </span>
      );
    }

    const match = content.match(/changed status from "?(.+?)"? to "?(.+?)"?$/i);
    if (!match) {
      return <span className="text-sm text-muted-foreground">{content}</span>;
    }

    return (
      <span className="text-sm text-muted-foreground">
        {t("activity:changedStatus", {
          from: getStatusLabel(match[1]),
          to: getStatusLabel(match[2]),
        })}
      </span>
    );
  }

  if (activity.type === "due_date_changed") {
    if (eventData) {
      const oldDueDate = eventData.oldDueDate
        ? formatActivityDateText(String(eventData.oldDueDate))
        : null;
      const newDueDate = eventData.newDueDate
        ? formatActivityDateText(String(eventData.newDueDate))
        : null;

      return (
        <span className="text-sm text-muted-foreground">
          {newDueDate
            ? oldDueDate
              ? t("activity:changedDueDate", {
                  from: oldDueDate,
                  to: newDueDate,
                })
              : t("activity:setDueDate", { date: newDueDate })
            : t("activity:clearedDueDate")}
        </span>
      );
    }

    const changeMatch = content.match(/changed due date from (.+) to (.+)$/i);
    if (changeMatch) {
      return (
        <span className="text-sm text-muted-foreground">
          {t("activity:changedDueDate", {
            from: formatActivityDateText(changeMatch[1]),
            to: formatActivityDateText(changeMatch[2]),
          })}
        </span>
      );
    }

    const setMatch = content.match(/set due date to (.+)$/i);
    if (setMatch) {
      return (
        <span className="text-sm text-muted-foreground">
          {t("activity:setDueDate", {
            date: formatActivityDateText(setMatch[1]),
          })}
        </span>
      );
    }

    if (content.includes("cleared the due date")) {
      return (
        <span className="text-sm text-muted-foreground">
          {t("activity:clearedDueDate")}
        </span>
      );
    }

    return <span className="text-sm text-muted-foreground">{content}</span>;
  }

  if (activity.type === "unassigned") {
    return (
      <span className="text-sm text-muted-foreground">
        {t("activity:unassigned")}
      </span>
    );
  }

  if (activity.type === "assignee_changed") {
    if (eventData) {
      if (eventData.isSelfAssigned) {
        return (
          <span className="text-sm text-muted-foreground">
            {t("activity:assignedToSelf")}
          </span>
        );
      }

      const targetId = String(eventData.newAssigneeId ?? "");
      const targetName = String(eventData.newAssignee ?? "");
      const targetUser =
        workspaceUsers?.find((member) => member.user?.id === targetId) || null;

      return (
        <span className="text-sm text-muted-foreground">
          {t("activity:assignedTo", {
            name: targetUser?.user?.name ?? targetName,
          })}
        </span>
      );
    }

    if (content.includes("themselves")) {
      return (
        <span className="text-sm text-muted-foreground">
          {t("activity:assignedToSelf")}
        </span>
      );
    }

    const tokenMatch = content.match(
      /assigned the task to \[\[user:([^|\]]+)\|([^\]]+)\]\]/,
    );
    if (tokenMatch) {
      const [, targetId, targetName] = tokenMatch;
      const targetUser =
        workspaceUsers?.find((member) => member.user?.id === targetId) || null;

      return (
        <span className="text-sm text-muted-foreground">
          {t("activity:assignedTo", {
            name: targetUser?.user?.name ?? targetName,
          })}
        </span>
      );
    }

    const legacyMatch = content.match(/assigned the task to (.+)$/i);
    if (legacyMatch) {
      const targetName = legacyMatch[1];
      const targetUser = findUserByName(workspaceUsers, targetName);
      return (
        <span className="text-sm text-muted-foreground">
          {t("activity:assignedTo", {
            name: targetUser?.user?.name ?? targetName,
          })}
        </span>
      );
    }
  }

  if (activity.type === "title_changed") {
    if (eventData) {
      const fromRaw = String(eventData.oldTitle ?? "");
      const toRaw = String(eventData.newTitle ?? "");
      const clip = (s: string) =>
        contentPreviewMaxLength && s.length > 48 ? `${s.slice(0, 48)}…` : s;
      return (
        <span className="text-sm text-muted-foreground">
          {t("activity:changedTitle", {
            from: clip(fromRaw),
            to: clip(toRaw),
          })}
        </span>
      );
    }

    const legacyMatch = content.match(/changed title from "(.+)" to "(.+)"$/i);
    if (legacyMatch) {
      const fromRaw = legacyMatch[1];
      const toRaw = legacyMatch[2];
      const clip = (s: string) =>
        contentPreviewMaxLength && s.length > 48 ? `${s.slice(0, 48)}…` : s;
      return (
        <span className="text-sm text-muted-foreground">
          {t("activity:changedTitle", {
            from: clip(fromRaw),
            to: clip(toRaw),
          })}
        </span>
      );
    }
  }

  if (activity.type === "moved") {
    if (eventData) {
      return (
        <span className="text-sm text-muted-foreground">
          {t("activity:moved", {
            from: String(eventData.fromProjectName ?? ""),
            to: String(eventData.toProjectName ?? ""),
          })}
        </span>
      );
    }
  }

  if (activity.type === "created") {
    if (eventData) {
      return (
        <span className="text-sm text-muted-foreground">
          {t("activity:created")}
        </span>
      );
    }
  }

  const raw = content || toDisplayCase(activity.type);
  if (contentPreviewMaxLength && raw.length > contentPreviewMaxLength) {
    return (
      <span className="text-sm text-muted-foreground" title={raw}>
        {raw.slice(0, contentPreviewMaxLength)}…
      </span>
    );
  }

  return <span className="text-sm text-muted-foreground">{raw}</span>;
}

function Activity({
  activity,
  step,
  showConnector = false,
  feedContext,
  workspaceMembers,
}: {
  activity: ActivityItem;
  step: number;
  showConnector?: boolean;
  feedContext?: ActivityFeedContext;
  /** When set, avoids refetching workspace members inside each activity row. */
  workspaceMembers?: WorkspaceUser[] | undefined;
}) {
  const { t } = useTranslation();
  const { data: workspace } = useActiveWorkspace();
  const { data: fetchedMembers } = useGetWorkspaceUsers({
    workspaceId: workspace?.id,
    enabled: workspaceMembers === undefined && Boolean(workspace?.id),
  });
  const workspaceUsers = workspaceMembers ?? fetchedMembers;

  const user = activity.userId
    ? workspaceUsers?.find(
        (workspaceUser) => workspaceUser.user?.id === activity.userId,
      )
    : null;

  const isExternalComment = Boolean(activity.externalSource);
  const displayName =
    activity.type === "comment" && isExternalComment
      ? (activity.externalUserName ?? t("activity:githubUser"))
      : (user?.user?.name ?? t("common:people.someone"));

  const avatarImageSrc =
    activity.type === "comment" && isExternalComment
      ? activity.externalUserAvatar
      : null;

  if (isCommentActivity(activity) && !feedContext?.unifiedFeedRow) {
    const commentUser = isExternalComment
      ? {
          id: undefined,
          name: activity.externalUserName ?? t("activity:githubUser"),
          email: undefined,
          image: activity.externalUserAvatar ?? undefined,
        }
      : {
          id: user?.user?.id,
          name: user?.user?.name,
          email: user?.user?.email,
          image: user?.user?.image,
        };

    return (
      <TimelineItem className="m-0! flex-row items-start py-2!" step={step}>
        <TimelineContent className="min-w-0 flex-1">
          <CommentCard
            commentId={activity.id}
            taskId={activity.taskId}
            content={activity.content || ""}
            user={commentUser}
            createdAt={activity.createdAt}
            externalSource={activity.externalSource}
            externalUrl={activity.externalUrl}
          />
          {feedContext ? <FeedTaskLink ctx={feedContext} /> : null}
        </TimelineContent>
      </TimelineItem>
    );
  }

  const rowClickable = Boolean(
    feedContext?.unifiedFeedRow && feedContext.onOpenTask,
  );

  const handleRowClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!rowClickable || !feedContext?.onOpenTask) return;
    const el = e.target as HTMLElement | null;
    if (el?.closest("a[href],button")) return;
    feedContext.onOpenTask();
  };

  const handleRowKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!rowClickable || !feedContext?.onOpenTask) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      feedContext.onOpenTask();
    }
  };

  const isUnifiedComment =
    isCommentActivity(activity) && Boolean(feedContext?.unifiedFeedRow);

  const commentPlainPreview =
    isUnifiedComment && activity.content
      ? toCommentPlainPreview(
          activity.content,
          feedContext?.contentPreviewMaxLength ?? 90,
        )
      : "";

  const activityIcon = getActivityTypeIcon(activity);

  const mainLine = isUnifiedComment ? (
    <>
      <span className="text-sm text-muted-foreground">
        {activity.externalSource === "github"
          ? t("activity:comment.commentedOnGithub")
          : t("activity:commentedOnTask")}
      </span>
      {commentPlainPreview ? (
        <span className="text-muted-foreground/85 text-xs">
          {" "}
          — {commentPlainPreview}
        </span>
      ) : (
        <span className="text-muted-foreground/70 text-xs">
          {" "}
          {t("activity:workspaceFeed.emptyCommentPreview")}
        </span>
      )}
      {activity.externalUrl && activity.externalSource !== "github" ? (
        <>
          {" "}
          <a
            href={activity.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline align-baseline text-muted-foreground text-xs underline-offset-2 hover:text-foreground hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              try {
                return new URL(activity.externalUrl as string).hostname;
              } catch {
                return activity.externalSource ?? "…";
              }
            })()}
          </a>
        </>
      ) : null}
    </>
  ) : (
    renderActivityContent({
      activity,
      workspaceUsers: workspaceUsers as WorkspaceUser[] | undefined,
      t,
      contentPreviewMaxLength: feedContext?.contentPreviewMaxLength,
    })
  );

  if (feedContext?.unifiedFeedRow) {
    return (
      // biome-ignore lint/a11y/noStaticElementInteractions: row cliquable pour ouvrir la feuille tâche
      <div
        className={cn(
          "group relative flex gap-3 py-2.5 px-2 -mx-2 rounded-lg",
          rowClickable &&
            "cursor-pointer transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none",
        )}
        tabIndex={rowClickable ? 0 : undefined}
        onClick={handleRowClick}
        onKeyDown={handleRowKeyDown}
      >
        {/* Left column: avatar + icon badge + connector */}
        <div
          className="relative flex shrink-0 flex-col items-center"
          style={{ width: 28 }}
        >
          {showConnector && (
            <span className="absolute top-8 bottom-[-10px] w-px bg-border/50" />
          )}
          <div className="relative">
            <Avatar className="size-7 ring-1 ring-border/40">
              <AvatarImage
                src={avatarImageSrc || user?.user?.image || ""}
                alt={displayName}
              />
              <AvatarFallback className="bg-muted text-[10px] font-medium">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-0.5 -right-1 flex size-[15px] items-center justify-center rounded-full bg-sidebar ring-[1.5px] ring-border/60 text-muted-foreground/90">
              {activityIcon}
            </span>
          </div>
        </div>

        {/* Right column */}
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5 leading-snug">
            <UserHoverName user={user || null} fallbackName={displayName} />
            <span className="text-sm text-muted-foreground">{mainLine}</span>
            <time
              className="ml-1 text-xs font-medium text-muted-foreground/50 tabular-nums"
              dateTime={activity.createdAt}
              title={formatDateTime(activity.createdAt)}
            >
              {formatTimeOnly(activity.createdAt)}
            </time>
          </div>
          {feedContext ? (
            <div className="mt-0.5">
              <FeedTaskLink ctx={feedContext} />
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <TimelineItem
      className="relative m-0! flex-row items-center gap-3 py-2.5!"
      step={step}
    >
      {showConnector && (
        <span className="-translate-x-1/2 absolute top-9 bottom-0 left-3 w-px bg-border/50" />
      )}
      <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground/80">
        {activityIcon}
      </span>
      <ActorAvatar
        user={user || null}
        fallbackName={displayName}
        imageSrc={avatarImageSrc}
      />
      <TimelineContent className="text-sm leading-6 text-foreground">
        <UserHoverName user={user || null} fallbackName={displayName} />{" "}
        {mainLine}{" "}
        <span className="whitespace-nowrap text-muted-foreground/70 text-xs">
          {formatRelativeTime(activity.createdAt)}
        </span>
        {feedContext ? <FeedTaskLink ctx={feedContext} /> : null}
      </TimelineContent>
    </TimelineItem>
  );
}

export default Activity;

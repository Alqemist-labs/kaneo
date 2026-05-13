type ActivityLike = {
  type: string;
  content: string | null;
};

export function isCommentActivity(activity: ActivityLike) {
  return activity.type === "comment" && Boolean(activity.content);
}

/** Plain text excerpt for activity feed lines (no rich editor). */
export function toCommentPlainPreview(markdown: string, maxLen: number) {
  let s = markdown
    .replace(/\r\n/g, "\n")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#>*_-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (s.length > maxLen) {
    s = `${s.slice(0, maxLen - 1)}…`;
  }
  return s;
}

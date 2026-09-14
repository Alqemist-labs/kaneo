import { Badge } from "@/components/ui/badge";
import { resolveLabelColor } from "@/lib/label-color";
import type Task from "@/types/task";

export function TaskLabels({
  labels,
}: {
  labels: NonNullable<Task["labels"]>;
}) {
  if (!labels.length) return null;

  return (
    <div className="flex min-w-0 flex-wrap gap-1">
      {labels.map((label) => (
        <Badge
          key={label.id}
          variant="outline"
          className="flex h-auto min-h-5.5 max-w-full min-w-0 items-center gap-1.5 px-2 py-0.5 text-[10px] whitespace-normal break-words"
        >
          <span
            aria-hidden="true"
            className="inline-block size-1.5 shrink-0 rounded-full"
            style={{
              backgroundColor: resolveLabelColor(label.color),
            }}
          />
          <span className="min-w-0 flex-1 break-words" title={label.name}>
            {label.name}
          </span>
        </Badge>
      ))}
    </div>
  );
}

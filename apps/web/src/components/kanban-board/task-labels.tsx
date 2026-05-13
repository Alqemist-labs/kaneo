import { Badge } from "@/components/ui/badge";
import useGetLabelsByTask from "@/hooks/queries/label/use-get-labels-by-task";

const labelColors = [
  { value: "gray", label: "Stone", color: "var(--color-stone-500)" },
  { value: "dark-gray", label: "Slate", color: "var(--color-slate-500)" },
  { value: "purple", label: "Lavender", color: "var(--color-violet-500)" },
  { value: "teal", label: "Sage", color: "var(--color-emerald-600)" },
  { value: "green", label: "Forest", color: "var(--color-green-600)" },
  { value: "yellow", label: "Amber", color: "var(--color-amber-600)" },
  { value: "orange", label: "Terracotta", color: "var(--color-orange-600)" },
  { value: "pink", label: "Rose", color: "var(--color-rose-600)" },
  { value: "red", label: "Crimson", color: "var(--color-red-600)" },
];

function isValidHtmlColor(color: string): boolean {
  const s = new Option().style;
  s.color = color;
  return s.color !== "";
}

function validColor(value: string): string {
  const mapped = labelColors.find((c) => c.value === value)?.color;
  if (mapped) {
    return mapped;
  }

  if (isValidHtmlColor(value)) {
    return value;
  }

  return "var(--color-neutral-400)";
}

function TaskCardLabels({ taskId }: { taskId: string }) {
  const { data: labels = [] } = useGetLabelsByTask(taskId);

  if (!labels.length) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {labels.map((label: { id: string; name: string; color: string }) => (
        <Badge
          key={label.id}
          variant="outline"
          className="flex h-auto min-h-5.5 max-w-full items-center gap-1.5 px-2 py-0.5 text-[10px] whitespace-normal break-words"
        >
          <span
            className="inline-block size-1.5 shrink-0 rounded-full"
            style={{
              backgroundColor: validColor(label.color),
            }}
          />
          <span className="min-w-0 flex-1 break-words">{label.name}</span>
        </Badge>
      ))}
    </div>
  );
}

export default TaskCardLabels;

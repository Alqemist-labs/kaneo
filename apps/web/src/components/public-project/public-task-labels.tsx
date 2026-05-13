import { Badge } from "@/components/ui/badge";
import labelColors from "@/constants/label-colors";

type PublicTaskLabelsProps = {
  labels: Array<{ id: string; name: string; color: string }>;
};

export function PublicTaskLabels({ labels }: PublicTaskLabelsProps) {
  if (!labels || labels.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {labels.map((label) => (
        <Badge
          key={label.id}
          variant="outline"
          className="flex h-auto min-h-5.5 max-w-full items-center gap-1.5 px-2 py-0.5 text-[10px] whitespace-normal break-words"
        >
          <span
            className="inline-block size-1.5 shrink-0 rounded-full"
            style={{
              backgroundColor:
                labelColors.find((c) => c.value === label.color)?.color ||
                "var(--color-neutral-400)",
            }}
          />
          <span className="min-w-0 flex-1 break-words">{label.name}</span>
        </Badge>
      ))}
    </div>
  );
}

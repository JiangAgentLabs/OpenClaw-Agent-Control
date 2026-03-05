import { cn } from "@/lib/utils";

export function Progress({ value, className }: { value: number; className?: string }) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-zinc-200", className)}>
      <div className="h-full bg-emerald-600 transition-all" style={{ width: `${safe}%` }} />
    </div>
  );
}

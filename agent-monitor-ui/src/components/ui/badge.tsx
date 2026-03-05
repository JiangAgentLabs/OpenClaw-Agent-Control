import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border", {
  variants: {
    variant: {
      ok: "border-emerald-200 bg-emerald-50 text-emerald-700",
      warn: "border-amber-200 bg-amber-50 text-amber-700",
      error: "border-rose-200 bg-rose-50 text-rose-700",
      neutral: "border-zinc-200 bg-zinc-50 text-zinc-700",
    },
  },
  defaultVariants: {
    variant: "neutral",
  },
});

export function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

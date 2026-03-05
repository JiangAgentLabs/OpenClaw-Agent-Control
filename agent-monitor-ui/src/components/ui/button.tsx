import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50", {
  variants: {
    variant: {
      default: "bg-zinc-900 text-white hover:bg-zinc-800",
      outline: "border border-zinc-200 bg-white hover:bg-zinc-50",
    },
    size: {
      default: "h-9 px-3",
      sm: "h-8 px-2.5",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export function Button({ className, variant, size, ...props }: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

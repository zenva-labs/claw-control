"use client";

import * as React from "react";
import { Progress as ProgressPrimitive } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const progressVariants = cva("bg-primary h-full w-full flex-1 transition-all", {
  variants: {
    variant: {
      default: "bg-primary",
      info: "bg-blue-600 dark:bg-blue-600",
      success: "bg-green-600 dark:bg-green-600",
      warn: "bg-amber-500 dark:bg-amber-400",
      danger: "bg-red-600 dark:bg-red-700",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

function Progress({
  className,
  value,
  variant,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & VariantProps<typeof progressVariants>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-secondary relative h-2 w-full overflow-hidden rounded-full border",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(progressVariants({ variant }))}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress, progressVariants };

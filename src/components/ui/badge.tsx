import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-sm border border-transparent px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        success:
          "bg-green-50 text-green-900 border-green-200 [a&]:hover:bg-green-100 dark:bg-green-900/80 dark:text-white dark:border-green-800",
        info: "bg-blue-50 text-blue-900 border-blue-200 [a&]:hover:bg-blue-100 dark:bg-blue-900/80 dark:text-white dark:border-blue-800",
        danger:
          "bg-red-50 text-red-900 border-red-200 [a&]:hover:bg-red-100 dark:bg-red-900/80 dark:text-white dark:border-red-800",
        link: "text-primary underline-offset-4 [a&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const DOT_COLORS: Record<string, string> = {
  default: "bg-primary-foreground/70",
  secondary: "bg-secondary-foreground/50",
  destructive: "bg-white/70",
  success: "bg-green-500 dark:bg-green-400",
  info: "bg-blue-500 dark:bg-blue-400",
  danger: "bg-red-500 dark:bg-red-400",
  outline: "bg-foreground/50",
  ghost: "bg-foreground/50",
  link: "bg-primary/50",
};

function Badge({
  className,
  variant = "default",
  asChild = false,
  showDot = false,
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
    showDot?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), showDot && "gap-1.5", className)}
      {...props}
    >
      {showDot && (
        <span
          className={cn("size-1.5 shrink-0 rounded-full", DOT_COLORS[variant ?? "default"])}
          aria-hidden
        />
      )}
      {children}
    </Comp>
  );
}

export { Badge, badgeVariants };

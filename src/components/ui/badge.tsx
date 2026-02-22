import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-sm border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "bg-destructive [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 text-white",
        outline:
          "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        success:
          "border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-900/80 dark:text-white [a&]:hover:bg-green-100",
        info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-900/80 dark:text-white [a&]:hover:bg-blue-100",
        danger:
          "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-900/80 dark:text-white [a&]:hover:bg-red-100",
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

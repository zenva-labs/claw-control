"use client";

import * as React from "react";
import { Tabs as TabsPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

function NavTabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="nav-tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn("group/nav-tabs flex gap-2 data-[orientation=horizontal]:flex-col", className)}
      {...props}
    />
  );
}

function NavTabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="nav-tabs-list"
      className={cn(
        "group/nav-tabs-list inline-flex w-fit items-center justify-center gap-1",
        "text-muted-foreground",
        "group-data-[orientation=horizontal]/nav-tabs:h-9",
        "group-data-[orientation=vertical]/nav-tabs:h-fit group-data-[orientation=vertical]/nav-tabs:flex-col",
        className,
      )}
      {...props}
    />
  );
}

function NavTabsTrigger({
  className,
  count,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & { count?: number }) {
  return (
    <TabsPrimitive.Trigger
      data-slot="nav-tabs-trigger"
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 cursor-pointer items-center justify-center gap-1.5",
        "rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap",
        "text-foreground/60 hover:text-foreground",
        "transition-all",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:outline-1",
        "disabled:pointer-events-none disabled:opacity-50",
        "bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none",
        "data-[state=active]:text-foreground",
        "dark:text-muted-foreground dark:hover:text-foreground",
        "dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-transparent",
        "group-data-[orientation=vertical]/nav-tabs:w-full group-data-[orientation=vertical]/nav-tabs:justify-start",
        // underline indicator
        "after:bg-foreground after:absolute after:opacity-0 after:transition-opacity",
        "group-data-[orientation=horizontal]/nav-tabs:after:inset-x-0 group-data-[orientation=horizontal]/nav-tabs:after:bottom-[-5px] group-data-[orientation=horizontal]/nav-tabs:after:h-0.5",
        "group-data-[orientation=vertical]/nav-tabs:after:inset-y-0 group-data-[orientation=vertical]/nav-tabs:after:-right-1 group-data-[orientation=vertical]/nav-tabs:after:w-0.5",
        "data-[state=active]:after:opacity-100",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      {count !== undefined && (
        <Badge variant="secondary" className="text-[11px] tabular-nums">
          {count}
        </Badge>
      )}
    </TabsPrimitive.Trigger>
  );
}

function NavTabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="nav-tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { NavTabs, NavTabsList, NavTabsTrigger, NavTabsContent };

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CommandIcon,
  BarChart3Icon,
  ClockIcon,
  ExternalLinkIcon,
  MessageSquareMoreIcon,
  RadioIcon,
  ScrollTextIcon,
  SparklesIcon,
  SettingsIcon,
  BookOpenIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navGroups = [
  {
    label: "Agents",
    items: [
      { href: "/", label: "Agents", icon: SparklesIcon },
      { href: "/sessions", label: "Sessions", icon: MessageSquareMoreIcon },
      { href: "/cron", label: "Cron Jobs", icon: ClockIcon },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/gateway", label: "Gateway", icon: RadioIcon },
      { href: "/usage", label: "Usage", icon: BarChart3Icon },
      { href: "/logs", label: "Logs", icon: ScrollTextIcon },
    ],
  },
  {
    label: "Settings",
    items: [{ href: "/settings", label: "Settings", icon: SettingsIcon }],
  },
  {
    label: "Resources",
    items: [
      {
        href: "https://docs.openclaw.ai",
        label: "OpenClaw Docs",
        icon: BookOpenIcon,
        external: true,
      },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="bg-foreground text-background dark:bg-background dark:text-foreground flex aspect-square size-8 items-center justify-center rounded-md border">
                  <CommandIcon className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Claw Control</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label} className="py-1">
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const { href, label, icon: Icon } = item;
                  const external = "external" in item && item.external;
                  const isActive =
                    !external && (href === "/" ? pathname === "/" : pathname.startsWith(href));
                  return (
                    <SidebarMenuItem key={href}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
                        <Link
                          href={href}
                          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        >
                          <Icon />
                          <span>{label}</span>
                          {external && <ExternalLinkIcon className="ml-auto size-3 opacity-50" />}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}

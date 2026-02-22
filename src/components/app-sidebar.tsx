"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CommandIcon,
  BarChart3Icon,
  ClockIcon,
  MessageSquareMoreIcon,
  RadioIcon,
  ScrollTextIcon,
  SparklesIcon,
  SettingsIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const navItems = [
  { href: "/", label: "Agents", icon: SparklesIcon },
  { href: "/sessions", label: "Sessions", icon: MessageSquareMoreIcon },
  { href: "/gateway", label: "Gateway", icon: RadioIcon },
  { href: "/usage", label: "Usage", icon: BarChart3Icon },
  { href: "/cron", label: "Cron Jobs", icon: ClockIcon },
  ,
];

const bottomNavItems = [
  { href: "/logs", label: "Logs", icon: ScrollTextIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
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
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(({ href, label, icon: Icon }) => {
                const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
                      <Link href={href}>
                        <Icon />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomNavItems.map(({ href, label, icon: Icon }) => {
                const isActive = pathname.startsWith(href);
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
                      <Link href={href}>
                        <Icon />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

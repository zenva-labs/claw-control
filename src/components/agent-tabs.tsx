"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  NavTabs,
  NavTabsList,
  NavTabsTrigger,
  NavTabsContent,
} from "@/components/ui/nav-tabs";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SessionsTable } from "@/components/sessions-table";
import { UsageDashboard } from "@/components/usage-dashboard";
import { CronJobCard } from "@/components/cron-job-card";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { SetBreadcrumbs } from "@/components/breadcrumb-provider";
import { CoreFilesTab } from "@/components/core-files-tab";
import type { CoreFile } from "@/lib/openclaw";
import {
  ClockIcon,
  BotIcon,
  SparklesIcon,
  WrenchIcon,
  SearchIcon,
} from "lucide-react";
import Link from "next/link";
import type {
  AgentConfig,
  CronJob,
  ResolvedSkill,
  ResolvedTool,
  UsageRecord,
} from "@/lib/types";

type SessionRow = {
  id: string;
  agentId: string;
  agentName: string;
  status: string;
  messageCount: number;
  totalCost: number;
  startedAt?: string;
  lastUserMessage?: string;
};

type SessionCounts = { active: number; archived: number; total: number };

export function AgentTabs({
  agent,
  allAgents,
  sessions,
  sessionCounts,
  usageRecords,
  cronJobs,
  skills,
  tools,
  coreFiles,
  activeTab,
}: {
  agent: AgentConfig;
  allAgents: AgentConfig[];
  sessions: SessionRow[];
  sessionCounts: SessionCounts;
  usageRecords: UsageRecord[];
  cronJobs: CronJob[];
  skills: ResolvedSkill[];
  tools: ResolvedTool[];
  coreFiles: CoreFile[];
  activeTab: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleTabChange = (tab: string) => {
    router.push(`${pathname}?tab=${tab}`, { scroll: false });
  };

  return (
    <NavTabs value={activeTab} onValueChange={handleTabChange}>
      <SetBreadcrumbs>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Agents</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{agent.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </SetBreadcrumbs>
      <div className="border-b mb-3">
        <Container>
          <div className="flex items-center gap-3 mt-1 mb-2 justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">
              {agent.name}
            </h1>
            <Badge variant="outline" className="font-mono text-[11px]">
              {agent.model}
            </Badge>
          </div>

          <NavTabsList className="mb-0.5">
            <NavTabsTrigger value="usage">Usage</NavTabsTrigger>
            <NavTabsTrigger value="details">Details</NavTabsTrigger>
            <NavTabsTrigger value="sessions">Sessions</NavTabsTrigger>
            <NavTabsTrigger value="tools">Tools</NavTabsTrigger>
            <NavTabsTrigger value="skills">Skills</NavTabsTrigger>
            <NavTabsTrigger value="cron">Cron Jobs</NavTabsTrigger>
            <NavTabsTrigger value="core-files">Core Files</NavTabsTrigger>
          </NavTabsList>
        </Container>
      </div>

      <NavTabsContent value="usage">
        <Container>
          <UsageDashboard records={usageRecords} />
        </Container>
      </NavTabsContent>

      <NavTabsContent value="details">
        <Container className="space-y-3 pt-1">
          <Card>
            <CardContent className="space-y-0 divide-y">
              <DetailRow
                label="ID"
                value={<span className="font-mono text-xs">{agent.id}</span>}
              />
              <DetailRow label="Name" value={agent.name} />
              <DetailRow
                label="Model"
                value={<span className="font-mono text-xs">{agent.model}</span>}
              />
              {agent.workspace && (
                <DetailRow
                  label="Workspace"
                  value={
                    <span className="font-mono text-xs">{agent.workspace}</span>
                  }
                />
              )}
              <DetailRow
                label="Default"
                value={
                  agent.default ? (
                    <Badge variant="success">Yes</Badge>
                  ) : (
                    <span className="text-muted-foreground">No</span>
                  )
                }
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-0 divide-y">
              <DetailRow
                label="Active Sessions"
                value={
                  <span className="tabular-nums">{sessionCounts.active}</span>
                }
              />
              <DetailRow
                label="Archived Sessions"
                value={
                  <span className="tabular-nums">{sessionCounts.archived}</span>
                }
              />
              <DetailRow
                label="Total Sessions"
                value={
                  <span className="tabular-nums font-medium">
                    {sessionCounts.total}
                  </span>
                }
              />
            </CardContent>
          </Card>
          <SubagentsCard agent={agent} allAgents={allAgents} />
        </Container>
      </NavTabsContent>

      <NavTabsContent value="sessions">
        {sessions.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">
            No sessions found for this agent.
          </p>
        ) : (
          <Container>
            <SessionsTable sessions={sessions} showAgent={false} />
          </Container>
        )}
      </NavTabsContent>

      <NavTabsContent value="tools">
        <Container>
          {tools.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
              <div className="rounded-full bg-muted p-3">
                <WrenchIcon className="size-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">No tools</p>
                <p className="text-muted-foreground text-sm mt-0.5">
                  No tools have been resolved for this agent yet.
                </p>
              </div>
            </div>
          ) : (
            <ToolsGrid tools={tools} />
          )}
        </Container>
      </NavTabsContent>

      <NavTabsContent value="skills">
        <Container>
          <SkillsPanel skills={skills} />
        </Container>
      </NavTabsContent>

      <NavTabsContent value="cron">
        <Container>
          {cronJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
              <div className="rounded-full bg-muted p-3">
                <ClockIcon className="size-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">No cron jobs</p>
                <p className="text-muted-foreground text-sm mt-0.5">
                  No scheduled jobs for this agent.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {cronJobs.map((job) => (
                <CronJobCard key={job.id} job={job} agent={agent} />
              ))}
            </div>
          )}
        </Container>
      </NavTabsContent>

      <NavTabsContent value="core-files">
        <CoreFilesTab files={coreFiles} workspace={agent.workspace} />
      </NavTabsContent>
    </NavTabs>
  );
}

function SkillsPanel({ skills }: { skills: ResolvedSkill[] }) {
  const [filter, setFilter] = useState<"all" | "enabled" | "disabled">("all");
  const [search, setSearch] = useState("");

  const enabled = skills.filter((s) => !s.disableModelInvocation);
  const disabled = skills.filter((s) => s.disableModelInvocation);

  const listForFilter =
    filter === "enabled" ? enabled : filter === "disabled" ? disabled : skills;

  const filtered = search.trim()
    ? listForFilter.filter((s) =>
        s.name.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : listForFilter;

  const counts = {
    all: skills.length,
    enabled: enabled.length,
    disabled: disabled.length,
  };

  return (
    <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
      <div className="flex items-center justify-between gap-1">
        <TabsList className="max-w-[400px]">
          <TabsTrigger value="all" count={counts.all}>
            All Available
          </TabsTrigger>
          <TabsTrigger value="enabled" count={counts.enabled}>
            Enabled
          </TabsTrigger>
          <TabsTrigger value="disabled" count={counts.disabled}>
            Disabled
          </TabsTrigger>
        </TabsList>
        <div className="relative w-56">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search skills…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {(["all", "enabled", "disabled"] as const).map((tab) => (
        <TabsContent key={tab} value={tab} className="mt-0">
          <SkillsList skills={filtered} emptyFilter={filter} search={search} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function SkillsList({
  skills,
  emptyFilter,
  search,
}: {
  skills: ResolvedSkill[];
  emptyFilter: "all" | "enabled" | "disabled";
  search: string;
}) {
  if (skills.length === 0) {
    const message = search.trim()
      ? `No skills match "${search.trim()}".`
      : emptyFilter === "enabled"
        ? "No enabled skills."
        : emptyFilter === "disabled"
          ? "No disabled skills."
          : "No skills have been added to this agent yet.";
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
        <div className="rounded-full bg-muted p-3">
          <SparklesIcon className="size-6 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-sm">No skills</p>
          <p className="text-muted-foreground text-sm mt-0.5">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {skills.map((skill) => (
        <Card key={skill.name}>
          <CardContent>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <p className="font-mono text-sm font-medium">{skill.name}</p>
                <p className="text-sm text-muted-foreground">
                  {skill.description}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Badge
                  variant={skill.disableModelInvocation ? "danger" : "success"}
                  className="text-[11px]"
                >
                  {skill.disableModelInvocation ? "Disabled" : "Enabled"}
                </Badge>
                <Badge variant="outline" className="text-[11px]">
                  {skill.source}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

const CATEGORY_ORDER = [
  "Files",
  "Runtime",
  "Web",
  "Media",
  "Memory",
  "Sessions",
  "Messaging",
  "Infrastructure",
];

function ToolsGrid({ tools }: { tools: ResolvedTool[] }) {
  const grouped = new Map<string, ResolvedTool[]>();
  for (const tool of tools) {
    const list = grouped.get(tool.category) ?? [];
    list.push(tool);
    grouped.set(tool.category, list);
  }
  const sortedCategories = [...grouped.keys()].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  return (
    <div className="space-y-3">
      {sortedCategories.map((category) => (
        <Card key={category}>
          <CardContent>
            <p className="text-sm font-medium mb-2">{category}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {grouped.get(category)!.map((tool) => (
                <div
                  key={tool.name}
                  className="flex items-start gap-2 rounded-md border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-medium">{tool.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {tool.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SubagentsCard({
  agent,
  allAgents,
}: {
  agent: AgentConfig;
  allAgents: AgentConfig[];
}) {
  const allowedIds = agent.subagents?.allowAgents ?? [];

  return (
    <Card>
      <CardContent className="space-y-0 divide-y">
        <div className="flex items-center gap-2 py-2.5 text-sm font-medium text-muted-foreground">
          <BotIcon className="size-3.5" />
          Allowed Subagents
          {allowedIds.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs tabular-nums">
              {allowedIds.length}
            </Badge>
          )}
        </div>
        {allowedIds.length === 0 ? (
          <p className="py-3 text-sm text-muted-foreground">
            No subagents configured.
          </p>
        ) : (
          allowedIds.map((id) => {
            const subagent = allAgents.find((a) => a.id === id);
            return (
              <div
                key={id}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <Link
                  href={`/agents/${id}`}
                  className="font-mono text-xs hover:underline text-foreground"
                >
                  {subagent?.name ?? id}
                </Link>
                {subagent ? (
                  <span className="font-mono text-xs text-muted-foreground">
                    {subagent.model}
                  </span>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    unknown
                  </Badge>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { NavTabs, NavTabsList, NavTabsTrigger, NavTabsContent } from "@/components/ui/nav-tabs";
import { SessionsTable } from "@/components/sessions-table";
import { UsageDashboard } from "@/components/usage-dashboard";
import { CronJobCard } from "@/components/cron-job-card";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Markdown } from "@/components/ui/markdown";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import type { CoreFile } from "@/lib/data";
import { ClockIcon, BotIcon, SparklesIcon, WrenchIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import type { AgentConfig, CronJob, ResolvedSkill, ResolvedTool, UsageRecord } from "@/lib/types";
import { getPlural } from "@/lib/utils";

type SessionRow = {
  id: string;
  agentId: string;
  agentName: string;
  status: string;
  messageCount: number;
  totalCost: number;
  startedAt?: string;
  lastUserMessage?: string;
  totalTokens?: number;
  contextTokens?: number;
};

type SessionCounts = { active: number; archived: number; total: number };

const TAB_LABELS: Record<string, string> = {
  usage: "Usage",
  details: "Details",
  sessions: "Sessions",
  tools: "Tools",
  skills: "Skills",
  cron: "Cron Jobs",
  "core-files": "Core Files",
};

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
              <BreadcrumbLink href={`/agents/${agent.id}`}>{agent.name}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{TAB_LABELS[activeTab] ?? activeTab}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </SetBreadcrumbs>
      <div className="mb-3 border-b">
        <Container>
          <div className="mt-1 mb-2 flex items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{agent.name}</h1>
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
              <DetailRow label="ID" value={<span className="font-mono text-xs">{agent.id}</span>} />
              <DetailRow label="Name" value={agent.name} />
              <DetailRow
                label="Model"
                value={<span className="font-mono text-xs">{agent.model}</span>}
              />
              {agent.workspace && (
                <DetailRow
                  label="Workspace"
                  value={<span className="font-mono text-xs">{agent.workspace}</span>}
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
                value={<span className="tabular-nums">{sessionCounts.active}</span>}
              />
              <DetailRow
                label="Archived Sessions"
                value={<span className="tabular-nums">{sessionCounts.archived}</span>}
              />
              <DetailRow
                label="Total Sessions"
                value={<span className="font-medium tabular-nums">{sessionCounts.total}</span>}
              />
            </CardContent>
          </Card>
          <SubagentsCard agent={agent} allAgents={allAgents} />
        </Container>
      </NavTabsContent>

      <NavTabsContent value="sessions">
        {sessions.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
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
              <div className="bg-muted rounded-full p-3">
                <WrenchIcon className="text-muted-foreground size-6" />
              </div>
              <div>
                <p className="text-sm font-medium">No tools</p>
                <p className="text-muted-foreground mt-0.5 text-sm">
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
              <div className="bg-muted rounded-full p-3">
                <ClockIcon className="text-muted-foreground size-6" />
              </div>
              <div>
                <p className="text-sm font-medium">No cron jobs</p>
                <p className="text-muted-foreground mt-0.5 text-sm">
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
  const [search, setSearch] = useState("");
  const [previewSkillName, setPreviewSkillName] = useState<string | null>(null);

  const enabledSkills = skills.filter((s) => !s.disableModelInvocation);
  const previewSkill = enabledSkills.find((skill) => skill.name === previewSkillName) ?? null;
  const filtered = search.trim()
    ? enabledSkills.filter((s) => s.name.toLowerCase().includes(search.trim().toLowerCase()))
    : enabledSkills;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="relative w-56">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
          <Input
            placeholder="Search skills…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Badge variant="secondary" className="text-xs tabular-nums">
          {enabledSkills.length} {getPlural("skill", "skills", enabledSkills.length)} enabled
        </Badge>
      </div>

      <SkillsList skills={filtered} search={search} onSkillSelect={setPreviewSkillName} />
      <SkillPreviewSheet
        skill={previewSkill}
        open={!!previewSkill}
        onOpenChange={(open) => {
          if (!open) setPreviewSkillName(null);
        }}
      />
    </div>
  );
}

function SkillsList({
  skills,
  search,
  onSkillSelect,
}: {
  skills: ResolvedSkill[];
  search: string;
  onSkillSelect: (skillName: string) => void;
}) {
  if (skills.length === 0) {
    const message = search.trim()
      ? `No enabled skills match "${search.trim()}".`
      : "No enabled skills for this agent yet.";
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
        <div className="bg-muted rounded-full p-3">
          <SparklesIcon className="text-muted-foreground size-6" />
        </div>
        <div>
          <p className="text-sm font-medium">No skills</p>
          <p className="text-muted-foreground mt-0.5 text-sm">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {skills.map((skill) => (
        <button
          key={skill.name}
          type="button"
          onClick={() => onSkillSelect(skill.name)}
          className="block w-full text-left"
        >
          <Card className="hover:bg-muted/40 transition-colors">
            <CardContent>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="font-mono text-sm font-medium">{skill.name}</p>
                  <p className="text-muted-foreground truncate text-xs">{skill.filePath}</p>
                  <p className="text-muted-foreground text-sm">{skill.description}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
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
        </button>
      ))}
    </div>
  );
}

function SkillPreviewSheet({
  skill,
  open,
  onOpenChange,
}: {
  skill: ResolvedSkill | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-3xl">
        <SheetHeader className="space-y-1 border-b pr-12">
          <SheetTitle className="font-mono text-sm">{skill?.name ?? "Skill Preview"}</SheetTitle>
          <SheetDescription className="truncate font-mono text-xs">
            {skill?.filePath ?? "SKILL.md file path is unavailable for this skill."}
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {skill?.markdown ? (
            <Markdown>{skill.markdown}</Markdown>
          ) : (
            <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm font-medium">Preview unavailable</p>
              <p className="text-muted-foreground text-sm">
                Could not load a SKILL.md file for this skill.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
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
            <p className="mb-2 text-sm font-medium">{category}</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {grouped.get(category)!.map((tool) => (
                <div key={tool.name} className="flex items-start gap-2 rounded-md border px-3 py-2">
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-medium">{tool.name}</p>
                    <p className="text-muted-foreground mt-0.5 text-xs">{tool.description}</p>
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

function SubagentsCard({ agent, allAgents }: { agent: AgentConfig; allAgents: AgentConfig[] }) {
  const allowedIds = agent.subagents?.allowAgents ?? [];

  return (
    <Card>
      <CardContent className="space-y-0 divide-y">
        <div className="text-muted-foreground flex items-center gap-2 py-2.5 text-sm font-medium">
          <BotIcon className="size-3.5" />
          Allowed Subagents
          {allowedIds.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs tabular-nums">
              {allowedIds.length}
            </Badge>
          )}
        </div>
        {allowedIds.length === 0 ? (
          <p className="text-muted-foreground py-3 text-sm">No subagents configured.</p>
        ) : (
          allowedIds.map((id) => {
            const subagent = allAgents.find((a) => a.id === id);
            return (
              <div key={id} className="flex items-center justify-between py-2.5 text-sm">
                <Link
                  href={`/agents/${id}`}
                  className="text-foreground font-mono text-xs hover:underline"
                >
                  {subagent?.name ?? id}
                </Link>
                {subagent ? (
                  <span className="text-muted-foreground font-mono text-xs">{subagent.model}</span>
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

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

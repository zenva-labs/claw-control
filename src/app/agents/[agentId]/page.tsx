import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAgents,
  getSessionsForAgent,
  getUsageData,
  getCronJobs,
  getSkillsForAgent,
  getToolsForAgent,
  getCoreFilesForAgent,
} from "@/lib/openclaw";
import { loadOrRedirectOnError } from "@/lib/server-page-error";
import { AgentTabs } from "@/components/agent-tabs";

export const metadata: Metadata = { title: "Agent | Claw Control" };
export const dynamic = "force-dynamic";

const VALID_TABS = [
  "usage",
  "details",
  "sessions",
  "tools",
  "skills",
  "cron",
  "core-files",
] as const;
type AgentTab = (typeof VALID_TABS)[number];

export default async function AgentPage({
  params,
  searchParams,
}: {
  params: Promise<{ agentId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { agentId } = await params;
  const { tab } = await searchParams;
  const activeTab: AgentTab = VALID_TABS.includes(tab as AgentTab) ? (tab as AgentTab) : "usage";
  const agents = loadOrRedirectOnError(() => getAgents(), {
    context: "loading agent configuration",
    retryPath: `/agents/${agentId}`,
  });
  const agent = agents.find((a) => a.id === agentId);
  if (!agent) notFound();

  const sessions = loadOrRedirectOnError(() => getSessionsForAgent(agentId), {
    context: `loading sessions for agent '${agentId}'`,
    retryPath: `/agents/${agentId}`,
  });
  const allUsage = loadOrRedirectOnError(() => getUsageData(), {
    context: `loading usage data for agent '${agentId}'`,
    retryPath: `/agents/${agentId}`,
  });
  const allCronJobs = loadOrRedirectOnError(() => getCronJobs(), {
    context: `loading cron jobs for agent '${agentId}'`,
    retryPath: `/agents/${agentId}`,
  });

  const sessionRows = sessions.map((s) => ({
    id: s.id,
    agentId: s.agentId,
    agentName: agent.name,
    status: s.status,
    messageCount: s.messageCount,
    totalCost: s.totalCost,
    startedAt: s.startedAt,
    lastUserMessage: s.lastUserMessage,
    totalTokens: s.totalTokens,
    contextTokens: s.contextTokens,
  }));

  const active = sessions.filter((s) => s.status === "active").length;
  const archived = sessions.filter((s) => s.status !== "active").length;
  const sessionCounts = { active, archived, total: sessions.length };

  const usageRecords = allUsage.filter((r) => r.agentId === agentId);
  const cronJobs = allCronJobs.filter((j) => j.sessionTarget === agentId);
  const skills = loadOrRedirectOnError(() => getSkillsForAgent(agentId), {
    context: `loading skills for agent '${agentId}'`,
    retryPath: `/agents/${agentId}`,
  });
  const tools = loadOrRedirectOnError(() => getToolsForAgent(agentId), {
    context: `loading tools for agent '${agentId}'`,
    retryPath: `/agents/${agentId}`,
  });
  const coreFiles = loadOrRedirectOnError(() => getCoreFilesForAgent(agent.workspace), {
    context: `loading core files for agent '${agentId}'`,
    retryPath: `/agents/${agentId}`,
  });

  return (
    <AgentTabs
      agent={agent}
      allAgents={agents}
      sessions={sessionRows}
      sessionCounts={sessionCounts}
      usageRecords={usageRecords}
      cronJobs={cronJobs}
      skills={skills}
      tools={tools}
      coreFiles={coreFiles}
      activeTab={activeTab}
    />
  );
}

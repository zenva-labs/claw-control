import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAgents, getSession } from "@/lib/data";
import { loadOrRedirectOnError } from "@/lib/server-page-error";
import { SessionDetails } from "@/components/session-details";

export const metadata: Metadata = { title: "Session | Claw Control" };

export const dynamic = "force-dynamic";

const VALID_TABS = ["chat", "metrics"] as const;
type SessionTab = (typeof VALID_TABS)[number];

export default async function SessionViewerPage({
  params,
  searchParams,
}: {
  params: Promise<{ agentId: string; sessionId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { agentId, sessionId } = await params;
  const { tab } = await searchParams;
  const activeTab: SessionTab = VALID_TABS.includes(tab as SessionTab)
    ? (tab as SessionTab)
    : "chat";
  const retryPath = `/agents/${agentId}/sessions/${sessionId}`;

  const agents = loadOrRedirectOnError(() => getAgents(), {
    context: "loading agent configuration",
    retryPath,
  });
  const agent = agents.find((a) => a.id === agentId);
  if (!agent) notFound();

  const session = loadOrRedirectOnError(() => getSession(agentId, sessionId), {
    context: `loading session '${sessionId}' for agent '${agentId}'`,
    retryPath,
  });
  if (!session) notFound();

  return (
    <SessionDetails
      agentId={agentId}
      agentName={agent.name}
      sessionId={sessionId}
      initialSession={session}
      activeTab={activeTab}
    />
  );
}

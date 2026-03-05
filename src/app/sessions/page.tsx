import type { Metadata } from "next";
import { getAgents, getAllSessions } from "@/lib/openclaw";
import { loadOrRedirectOnError } from "@/lib/server-page-error";
import { SessionsTable } from "@/components/sessions-table";
import { Container } from "@/components/ui/container";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { getPlural } from "@/lib/utils";

export const metadata: Metadata = { title: "Sessions | Claw Control" };
export const dynamic = "force-dynamic";

export default function AllSessionsPage() {
  const agents = loadOrRedirectOnError(() => getAgents(), {
    context: "loading agent configuration",
    retryPath: "/sessions",
  });
  const sessions = loadOrRedirectOnError(() => getAllSessions(), {
    context: "loading sessions across all agents",
    retryPath: "/sessions",
  });
  const activeCount = sessions.filter((s) => s.status === "active").length;

  const rows = sessions.map((s) => ({
    id: s.id,
    agentId: s.agentId,
    agentName: s.agentName,
    status: s.status,
    messageCount: s.messageCount,
    totalCost: s.totalCost,
    startedAt: s.startedAt,
    lastUserMessage: s.lastUserMessage,
    totalTokens: s.totalTokens,
    contextTokens: s.contextTokens,
  }));

  return (
    <Container fullWidth>
      <PageBreadcrumb page="Sessions" />
      <div className="mb-3 flex items-end justify-between gap-1">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">All Sessions</h1>
          <p className="text-muted-foreground text-sm">
            All active and archived sessions across all agents.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1">
            <span className="font-medium">{sessions.length}</span>
            <span className="text-muted-foreground tabular-nums">
              total {getPlural("session", "sessions", sessions.length)}
            </span>
          </div>
          <span className="text-muted-foreground">&middot;</span>
          <div className="flex items-center gap-1">
            <span className="font-medium">{activeCount}</span>
            <span className="text-muted-foreground tabular-nums">
              {getPlural("active", "active", activeCount)} sessions
            </span>
          </div>
          <span className="text-muted-foreground">&middot;</span>
          <div className="flex items-center gap-1">
            <span className="font-medium">{agents.length}</span>
            <span className="text-muted-foreground tabular-nums">
              {getPlural("agent", "agents", agents.length)}
            </span>
          </div>
        </div>
      </div>

      {sessions.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">No sessions found.</p>
      ) : (
        <SessionsTable sessions={rows} />
      )}
    </Container>
  );
}

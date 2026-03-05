import type { Metadata } from "next";
import Link from "next/link";
import { getAgents, getAgentSessionCounts } from "@/lib/openclaw";
import { loadOrRedirectOnError } from "@/lib/server-page-error";

export const dynamic = "force-dynamic";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPlural } from "@/lib/utils";
import { Container } from "@/components/ui/container";
import { PageBreadcrumb } from "@/components/page-breadcrumb";

export const metadata: Metadata = { title: "Agents | Claw Control" };

export default function DashboardPage() {
  const agents = loadOrRedirectOnError(() => getAgents(), {
    context: "loading agent configuration",
    retryPath: "/",
  });
  const counts = loadOrRedirectOnError(() => getAgentSessionCounts(), {
    context: "loading session counts for agents",
    retryPath: "/",
  });

  return (
    <Container>
      <PageBreadcrumb page="Agents" />
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Agents</h1>
      <p className="text-muted-foreground mb-3 text-sm">
        {agents.length} agent{agents.length !== 1 && "s"} configured.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => {
          const c = counts[agent.id] || { active: 0, archived: 0, total: 0 };
          return (
            <Link key={agent.id} href={`/agents/${agent.id}`}>
              <Card className="hover:bg-accent/50 h-full cursor-pointer transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{agent.name}</CardTitle>
                    {agent.default && (
                      <Badge variant="secondary" className="text-[10px]">
                        default
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="font-mono text-xs">{agent.id}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 text-sm">
                    <Badge variant="outline" className="font-mono text-[11px]">
                      {agent.model}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground mt-3 flex gap-4 text-xs">
                    <span>
                      <span className="text-foreground font-medium">{c.active}</span> active{" "}
                      {getPlural("session", "sessions", c.active)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </Container>
  );
}

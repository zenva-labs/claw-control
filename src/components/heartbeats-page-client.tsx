"use client";

import { useState, useEffect } from "react";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  HeartPulseIcon,
  ClockIcon,
  FileTextIcon,
  ChevronDownIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ServerIcon,
  TimerIcon,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import type { HeartbeatStatus } from "@/lib/types";

export function HeartbeatsPageClient({
  status,
  lastUpdatedAt,
}: {
  status: HeartbeatStatus;
  lastUpdatedAt: string;
}) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 15_000);
    return () => clearInterval(interval);
  }, []);

  const enabledAgents = status.agents.filter((a) => a.enabled);

  return (
    <Container>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-semibold tracking-tight">Heartbeats</h1>
          <p className="text-muted-foreground text-sm">
            Heartbeat configuration and status across all agents.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-muted-foreground text-xs">
            Updated{" "}
            {formatDistanceToNow(new Date(lastUpdatedAt), {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={<HeartPulseIcon className="size-4" />}
          label="Enabled Agents"
          value={`${enabledAgents.length} / ${status.agents.length}`}
          sub={`${status.agents.length - enabledAgents.length} disabled`}
        />
        <SummaryCard
          icon={<TimerIcon className="size-4" />}
          label="Default Interval"
          value={enabledAgents.find((a) => a.agentId === status.defaultAgentId)?.every ?? "—"}
          sub={`Default agent: ${status.defaultAgentId}`}
        />
        <SummaryCard
          icon={<ClockIcon className="size-4" />}
          label="Last Heartbeat"
          value={
            status.lastHeartbeatAt
              ? formatDistanceToNow(new Date(status.lastHeartbeatAt), {
                  addSuffix: true,
                })
              : "Never"
          }
          sub={status.lastHeartbeatAt ? format(new Date(status.lastHeartbeatAt), "h:mm a") : ""}
        />
        <SummaryCard
          icon={<ServerIcon className="size-4" />}
          label="Recent Events"
          value={String(status.recentHeartbeatEvents.length)}
          sub="Heartbeat log entries"
        />
      </div>

      {/* Agent heartbeat cards */}
      <h2 className="mb-2 text-lg font-semibold">Agents</h2>
      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {status.agents.map((agent) => {
          const hbFile = status.heartbeatFilePaths.find((f) => f.agentId === agent.agentId);
          return <AgentHeartbeatCard key={agent.agentId} agent={agent} heartbeatFile={hbFile} />;
        })}
      </div>

      {/* Recent heartbeat events */}
      <RecentEventsSection events={status.recentHeartbeatEvents} />
    </Container>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card className="gap-2 py-3">
      <CardHeader className="gap-0 pb-0">
        <CardDescription className="flex items-center gap-1.5">
          {icon}
          {label}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-semibold">{value}</div>
        {sub && <p className="text-muted-foreground mt-0.5 text-xs">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function AgentHeartbeatCard({
  agent,
  heartbeatFile,
}: {
  agent: HeartbeatStatus["agents"][number];
  heartbeatFile?: HeartbeatStatus["heartbeatFilePaths"][number];
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{agent.agentName}</CardTitle>
        </div>
        <CardDescription className="font-mono text-xs">{agent.agentId}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <DetailLabel>Heartbeat</DetailLabel>
          <DetailValue>
            {agent.enabled ? (
              <span className="flex items-center justify-end gap-1 text-xs text-green-500 dark:text-green-600">
                <CheckCircle2Icon className="size-3" /> Enabled
              </span>
            ) : (
              <span className="text-muted-foreground text-xs">Disabled</span>
            )}
          </DetailValue>
          <DetailLabel>Interval</DetailLabel>
          <DetailValue>
            {agent.enabled ? (
              <span className="font-medium">{agent.every}</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </DetailValue>

          <DetailLabel>Interval (ms)</DetailLabel>
          <DetailValue>
            {agent.everyMs != null ? (
              <span className="font-mono tabular-nums">{agent.everyMs.toLocaleString()}</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </DetailValue>
        </div>

        {heartbeatFile && (
          <div className="border-t pt-2">
            <div className="flex items-center gap-1.5 text-xs">
              <FileTextIcon className="text-muted-foreground size-3" />
              <span className="text-muted-foreground">HEARTBEAT.md</span>
              {heartbeatFile.exists ? (
                <CheckCircle2Icon className="size-3 text-green-500" />
              ) : (
                <XCircleIcon className="text-muted-foreground size-3" />
              )}
            </div>
            <p className="text-muted-foreground mt-0.5 font-mono text-[10px] leading-tight break-all">
              {heartbeatFile.path}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DetailLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-muted-foreground text-xs">{children}</span>;
}

function DetailValue({ children }: { children: React.ReactNode }) {
  return <span className="text-right text-xs">{children}</span>;
}

function RecentEventsSection({ events }: { events: HeartbeatStatus["recentHeartbeatEvents"] }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? events : events.slice(0, 5);

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold">Recent Heartbeat Events</h2>
      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-12 text-center">
          <div className="bg-muted rounded-full p-3">
            <HeartPulseIcon className="text-muted-foreground size-6" />
          </div>
          <div>
            <p className="text-sm font-medium">No heartbeat events</p>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Heartbeat log entries will appear here when the gateway is running.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b text-left">
                <th className="px-4 py-2.5 font-medium">Time</th>
                <th className="px-4 py-2.5 font-medium">Interval</th>
                <th className="px-4 py-2.5 font-medium">Age</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((event, i) => (
                <tr key={`${event.timestamp}-${i}`} className="border-b last:border-0">
                  <td className="px-4 py-2 font-mono text-xs">
                    {event.timestamp ? format(new Date(event.timestamp), "MMM d, h:mm:ss a") : "—"}
                  </td>
                  <td className="px-4 py-2 tabular-nums">
                    {event.intervalMs > 0 ? formatMs(event.intervalMs) : "—"}
                  </td>
                  <td className="text-muted-foreground px-4 py-2 text-xs">
                    {event.timestamp
                      ? formatDistanceToNow(new Date(event.timestamp), {
                          addSuffix: true,
                        })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {events.length > 5 && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="hover:bg-muted/50 flex w-full items-center justify-center gap-1 border-t px-4 py-2 text-xs transition-colors"
            >
              <ChevronDownIcon
                className={`size-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
              />
              {expanded ? "Show less" : `Show ${events.length - 5} more`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function formatMs(ms: number): string {
  if (ms >= 3600000) return `${(ms / 3600000).toFixed(0)}h`;
  if (ms >= 60000) return `${(ms / 60000).toFixed(0)}m`;
  if (ms >= 1000) return `${(ms / 1000).toFixed(0)}s`;
  return `${ms}ms`;
}

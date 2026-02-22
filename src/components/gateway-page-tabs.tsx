"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { NavTabs, NavTabsList, NavTabsTrigger, NavTabsContent } from "@/components/ui/nav-tabs";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SecretField } from "@/components/secret-field";
import { MonitorIcon, ShieldIcon, MessageSquareMoreIcon } from "lucide-react";
import Link from "next/link";
import { format, formatDistanceToNow, intervalToDuration } from "date-fns";
import type { GatewayInfo, PairedDevice, SessionSummary } from "@/lib/types";

type HealthStatus = "checking" | "online" | "offline";

function useGatewayHealth() {
  const [status, setStatus] = useState<HealthStatus>("checking");
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const res = await fetch("/api/gateway/health", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) {
          setStatus(data.status === "online" ? "online" : "offline");
          setLastCheckedAt(new Date());
        }
      } catch {
        if (!cancelled) {
          setStatus("offline");
          setLastCheckedAt(new Date());
        }
      }
    }
    check();
    const interval = setInterval(check, 15_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  return { status, lastCheckedAt };
}

function formatUptime(startedAt: string | null): string {
  if (!startedAt) return "Unknown";
  const start = new Date(startedAt);
  if (start.getTime() > Date.now()) return "Unknown";
  const dur = intervalToDuration({ start, end: new Date() });
  const parts: string[] = [];
  if (dur.days) parts.push(`${dur.days}d`);
  if (dur.hours) parts.push(`${dur.hours}h`);
  parts.push(`${dur.minutes ?? 0}m`);
  return parts.join(" ");
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function HealthBadge({ status }: { status: HealthStatus }) {
  if (status === "checking") {
    return (
      <Badge variant="outline" className="text-xs">
        Checking…
      </Badge>
    );
  }
  return (
    <Badge variant={status === "online" ? "success" : "danger"} className="text-xs" showDot>
      {status === "online" ? "Online" : "Offline"}
    </Badge>
  );
}

function OverviewTab({ info, health }: { info: GatewayInfo; health: HealthStatus }) {
  return (
    <Container className="space-y-3">
      <Card>
        <CardContent className="space-y-0 divide-y">
          <DetailRow label="Health Status" value={<HealthBadge status={health} />} />
          <DetailRow
            label="Uptime"
            value={
              health === "online" ? (
                <span className="tabular-nums">{formatUptime(info.startedAt)}</span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )
            }
          />
          <DetailRow
            label="WebSocket URL"
            value={<span className="font-mono text-xs">{info.wsUrl}</span>}
          />
          <DetailRow
            label="Port"
            value={<span className="font-mono text-xs tabular-nums">{info.port}</span>}
          />
          {info.pid && (
            <DetailRow
              label="PID"
              value={<span className="font-mono text-xs tabular-nums">{info.pid}</span>}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-0 divide-y">
          <DetailRow label="Gateway Token" value={<SecretField value={info.auth.token} />} />
          <DetailRow
            label="Auth Mode"
            value={
              <Badge variant="outline" className="text-xs capitalize">
                {info.auth.mode}
              </Badge>
            }
          />
          <DetailRow
            label="Network Bind"
            value={
              <Badge variant="outline" className="text-xs">
                {info.bind}
              </Badge>
            }
          />
          <DetailRow
            label="Gateway Mode"
            value={
              <Badge variant="outline" className="text-xs capitalize">
                {info.mode}
              </Badge>
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-0 divide-y">
          <DetailRow
            label="Tailscale"
            value={
              <Badge
                variant={info.tailscale.mode === "off" ? "outline" : "info"}
                className="text-xs capitalize"
              >
                {info.tailscale.mode}
              </Badge>
            }
          />
          <DetailRow
            label="Cron Jobs"
            value={
              info.cronEnabled ? (
                <Badge variant="success" className="text-xs">
                  {info.cronJobCount} active
                </Badge>
              ) : (
                <span className="text-muted-foreground text-xs">None configured</span>
              )
            }
          />
          {info.healthMonitor && (
            <DetailRow
              label="Health Monitor"
              value={
                <span className="text-xs tabular-nums">
                  interval {info.healthMonitor.interval}s · grace {info.healthMonitor.grace}s
                </span>
              }
            />
          )}
          <DetailRow
            label="Version"
            value={<span className="font-mono text-xs">{info.version}</span>}
          />
          {info.startedAt && (
            <DetailRow
              label="Started At"
              value={
                <span className="text-xs tabular-nums">
                  {format(new Date(info.startedAt), "MMM d, yyyy, h:mm a")}
                </span>
              }
            />
          )}
        </CardContent>
      </Card>

      {info.deniedCommands.length > 0 && (
        <Card>
          <CardContent>
            <p className="text-muted-foreground mb-2.5 text-sm font-medium">Denied Node Commands</p>
            <div className="flex flex-wrap gap-1.5">
              {info.deniedCommands.map((cmd) => (
                <Badge key={cmd} variant="outline" className="font-mono text-[11px]">
                  {cmd}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}

function InstancesTab({ devices }: { devices: PairedDevice[] }) {
  if (devices.length === 0) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <div className="bg-muted rounded-full p-3">
            <MonitorIcon className="text-muted-foreground size-6" />
          </div>
          <div>
            <p className="text-sm font-medium">No paired devices</p>
            <p className="text-muted-foreground mt-0.5 text-sm">
              No devices have connected to this gateway yet.
            </p>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="flex flex-col gap-2">
        {devices.map((device) => (
          <Card key={device.deviceId}>
            <CardContent>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <MonitorIcon className="text-muted-foreground size-4 shrink-0" />
                    <p className="truncate font-mono text-sm font-medium">{device.clientId}</p>
                  </div>
                  <div className="text-muted-foreground ml-6 flex items-center gap-2 text-xs">
                    <span>{device.platform}</span>
                    <span>·</span>
                    <span>{device.clientMode}</span>
                    <span>·</span>
                    <span>Paired {format(device.approvedAtMs, "MMM d, yyyy, h:mm a")}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Badge variant="outline" className="text-[11px] capitalize">
                    {device.role}
                  </Badge>
                </div>
              </div>
              <div className="mt-2.5 ml-6 flex flex-wrap gap-1">
                {device.scopes.map((scope) => (
                  <Badge key={scope} variant="secondary" className="font-mono text-[11px]">
                    {scope}
                  </Badge>
                ))}
              </div>
              <div className="mt-2 ml-6">
                <p className="text-muted-foreground truncate font-mono text-[11px]">
                  Device ID: {device.deviceId}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Container>
  );
}

type ActiveSession = SessionSummary & { agentName: string };

function SessionsTab({ sessions }: { sessions: ActiveSession[] }) {
  if (sessions.length === 0) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <div className="bg-muted rounded-full p-3">
            <MessageSquareMoreIcon className="text-muted-foreground size-6" />
          </div>
          <div>
            <p className="text-sm font-medium">No active sessions</p>
            <p className="text-muted-foreground mt-0.5 text-sm">
              There are no active sessions across any agents right now.
            </p>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="flex flex-col gap-2">
        {sessions.map((session) => (
          <Link
            key={session.id}
            href={`/agents/${session.agentId}/sessions/${session.id}`}
            className="block"
          >
            <Card className="hover:bg-accent/50 transition-colors">
              <CardContent>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldIcon className="text-muted-foreground size-4 shrink-0" />
                      <p className="truncate font-mono text-xs font-medium">{session.id}</p>
                    </div>
                    {session.lastUserMessage && (
                      <p className="text-muted-foreground ml-6 line-clamp-1 text-sm">
                        {session.lastUserMessage}
                      </p>
                    )}
                    <div className="text-muted-foreground ml-6 flex items-center gap-2 text-xs">
                      <span>{session.agentName}</span>
                      <span>·</span>
                      <span className="tabular-nums">{session.messageCount} messages</span>
                      {session.totalCost > 0 && (
                        <>
                          <span>·</span>
                          <span className="tabular-nums">${session.totalCost.toFixed(4)}</span>
                        </>
                      )}
                      <span>·</span>
                      <span>
                        {formatDistanceToNow(new Date(session.modifiedAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                  <Badge variant="success" className="shrink-0 text-[11px]">
                    Active
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </Container>
  );
}

export function GatewayPageTabs({
  info,
  devices,
  sessions,
  activeTab,
}: {
  info: GatewayInfo;
  devices: PairedDevice[];
  sessions: ActiveSession[];
  activeTab: string;
}) {
  const { status: health, lastCheckedAt } = useGatewayHealth();
  const router = useRouter();
  const pathname = usePathname();

  const handleTabChange = (tab: string) => {
    router.push(`${pathname}?tab=${tab}`, { scroll: false });
  };

  return (
    <NavTabs value={activeTab} onValueChange={handleTabChange}>
      <div className="mb-3 border-b">
        <Container>
          <div className="mb-2 flex items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">Gateway</h1>
            <div className="flex items-center gap-3">
              {lastCheckedAt && (
                <span className="text-muted-foreground text-xs">
                  Updated {formatDistanceToNow(lastCheckedAt, { addSuffix: true })}
                </span>
              )}
            </div>
          </div>
          <NavTabsList className="mb-0.5">
            <NavTabsTrigger value="overview">Overview</NavTabsTrigger>
            <NavTabsTrigger value="instances" count={devices.length}>
              Instances
            </NavTabsTrigger>
            <NavTabsTrigger value="sessions" count={sessions.length}>
              Sessions
            </NavTabsTrigger>
          </NavTabsList>
        </Container>
      </div>

      <NavTabsContent value="overview">
        <OverviewTab info={info} health={health} />
      </NavTabsContent>

      <NavTabsContent value="instances">
        <InstancesTab devices={devices} />
      </NavTabsContent>

      <NavTabsContent value="sessions">
        <SessionsTab sessions={sessions} />
      </NavTabsContent>
    </NavTabs>
  );
}

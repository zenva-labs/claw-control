import { format, formatDistanceToNow } from "date-fns";
import { CableIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import type { ChannelFileInfo, ChannelInfo, ChannelsStatus } from "@/lib/types";

export function ChannelsPageContent({
  status,
  lastUpdatedAt,
}: {
  status: ChannelsStatus;
  lastUpdatedAt: string;
}) {
  return (
    <Container>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h1 className="mb-1 text-2xl font-semibold tracking-tight">Channels</h1>
          <p className="text-muted-foreground text-sm">Connected OpenClaw channels.</p>
        </div>
        <span className="text-muted-foreground shrink-0 text-xs">
          Updated {formatDistanceToNow(new Date(lastUpdatedAt), { addSuffix: true })}
        </span>
      </div>

      {status.channels.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <div className="bg-muted rounded-full p-3">
            <CableIcon className="text-muted-foreground size-6" />
          </div>
          <div>
            <p className="text-sm font-medium">No channels configured</p>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Add entries under <span className="font-mono text-xs">channels</span> in
              <span className="font-mono text-xs"> openclaw.json</span> to populate this page.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {status.channels.map((channel) => (
            <ChannelSections key={channel.id} channel={channel} />
          ))}
        </div>
      )}
    </Container>
  );
}

function ChannelSections({ channel }: { channel: ChannelInfo }) {
  const enabledVariant =
    channel.enabled === true ? "success" : channel.enabled === false ? "outline" : "info";
  const enabledLabel =
    channel.enabled === true ? "Enabled" : channel.enabled === false ? "Disabled" : "Unknown";

  const configEntries = Object.entries(channel.config).sort(([left], [right]) =>
    left.localeCompare(right),
  );

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base leading-none font-semibold">{channel.id}</h2>
          <p className="text-muted-foreground mt-1 font-mono text-[11px]">{channel.stateDirPath}</p>
        </div>
        <Badge variant={enabledVariant} className="shrink-0 text-[11px]" showDot>
          {enabledLabel}
        </Badge>
      </div>

      <Card>
        <CardContent className="space-y-0 divide-y">
          <DetailRow
            label="State Directory"
            value={
              <span className="font-mono text-xs">
                {channel.stateDirExists ? "Present" : "Missing"}
              </span>
            }
          />
          <DetailRow
            label="Session State Entries"
            value={<span className="font-mono text-xs tabular-nums">{channel.sessionCount}</span>}
          />
          <DetailRow label="Last Seen" value={formatDateTime(channel.lastSeenAt)} />
          <DetailRow
            label="Accounts"
            value={
              channel.accountIds.length > 0 ? (
                <span className="font-mono text-xs">{channel.accountIds.join(", ")}</span>
              ) : (
                <span className="text-muted-foreground text-xs">—</span>
              )
            }
          />
          <DetailRow
            label="Agents"
            value={
              channel.agentIds.length > 0 ? (
                <span className="font-mono text-xs">{channel.agentIds.join(", ")}</span>
              ) : (
                <span className="text-muted-foreground text-xs">—</span>
              )
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-0 divide-y">
          {configEntries.length === 0 ? (
            <DetailRow
              label="Channel Config"
              value={<span className="text-muted-foreground text-xs">No values</span>}
            />
          ) : (
            configEntries.map(([key, value]) => (
              <DetailRow
                key={key}
                label={formatConfigLabel(key)}
                value={formatConfigValue(value)}
              />
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-0 divide-y">
          <DetailRow
            label="State File Names"
            value={renderFileList(channel.stateFiles, "No state files")}
          />
          <DetailRow
            label="Credential File Names"
            value={renderFileList(channel.credentialFiles, "No credential files")}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[70%] text-right">{value}</span>
    </div>
  );
}

function formatDateTime(value: string | null): React.ReactNode {
  if (!value) return <span className="text-muted-foreground text-xs">—</span>;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime()))
    return <span className="text-muted-foreground text-xs">—</span>;

  return (
    <span className="font-mono text-xs">
      {format(parsed, "MMM d, yyyy, h:mm:ss a")} ({formatDistanceToNow(parsed, { addSuffix: true })}
      )
    </span>
  );
}

function formatConfigLabel(value: string): string {
  const withSpaces = value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ");
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

function formatConfigValue(value: unknown): React.ReactNode {
  if (typeof value === "boolean") {
    return (
      <Badge variant={value ? "success" : "outline"} className="text-[11px]" showDot>
        {value ? "True" : "False"}
      </Badge>
    );
  }

  if (typeof value === "string") {
    return <span className="font-mono text-xs">{value || "—"}</span>;
  }

  if (typeof value === "number") {
    return <span className="font-mono text-xs tabular-nums">{value}</span>;
  }

  if (value === null || value === undefined) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  return <span className="font-mono text-xs">{JSON.stringify(value)}</span>;
}

function renderFileList(files: ChannelFileInfo[], emptyLabel: string): React.ReactNode {
  if (files.length === 0)
    return <span className="text-muted-foreground text-xs">{emptyLabel}</span>;

  return (
    <span className="font-mono text-xs break-all">{files.map((file) => file.name).join(", ")}</span>
  );
}

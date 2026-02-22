"use client";

import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { AgentConfig, CronJob } from "@/lib/types";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-2 py-1.5 border-b last:border-0 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-mono text-xs break-all">{value}</span>
    </div>
  );
}

function formatMs(ms: number | undefined): string {
  if (ms == null) return "—";
  return format(ms, "MMM d, yyyy, h:mm a");
}

function formatSchedule(job: CronJob): React.ReactNode {
  const { schedule } = job;
  if (schedule.kind === "at" && schedule.at) {
    return (
      <>
        <span className="text-muted-foreground mr-1">once at</span>
        {format(new Date(schedule.at), "MMM d, yyyy, h:mm a")}
      </>
    );
  }
  if (schedule.kind === "cron" && schedule.cron) {
    return schedule.cron;
  }
  return schedule.kind;
}

export function CronJobCard({
  job,
  agent,
}: {
  job: CronJob;
  agent?: AgentConfig;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 px-4 py-3.5 text-left hover:bg-muted/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          {job.enabled ? (
            <Badge variant="success">Enabled</Badge>
          ) : (
            <Badge variant="secondary" className="shrink-0">
              Disabled
            </Badge>
          )}
          <span className="font-medium text-sm truncate">{job.name}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-xs">
          {agent ? (
            <Link
              href={`/agents/${agent.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-foreground font-medium hover:underline"
            >
              {agent.name}
            </Link>
          ) : (
            <span className="text-muted-foreground font-mono">
              {job.sessionTarget}
            </span>
          )}
          <span className="hidden sm:block text-muted-foreground">
            {formatSchedule(job)}
          </span>
          <ChevronDownIcon
            className={`size-4 transition-transform duration-200 text-muted-foreground ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t pt-3">
          <Row label="ID" value={job.id} />
          <Row
            label="Schedule"
            value={
              <span>
                <span className="text-muted-foreground mr-1">
                  {job.schedule.kind}
                </span>
                {job.schedule.at && format(new Date(job.schedule.at), "MMM d, yyyy, h:mm a")}
                {job.schedule.cron && job.schedule.cron}
              </span>
            }
          />
          <Row
            label="Agent"
            value={
              agent ? (
                <Link
                  href={`/agents/${agent.id}`}
                  className="hover:underline text-foreground"
                >
                  {agent.name}
                  <span className="text-muted-foreground ml-1">
                    ({agent.id})
                  </span>
                </Link>
              ) : (
                job.sessionTarget
              )
            }
          />
          <Row label="Wake Mode" value={job.wakeMode ?? "—"} />
          <Row label="Payload Kind" value={job.payload.kind} />
          {job.payload.text && (
            <Row label="Payload Text" value={job.payload.text} />
          )}
          <Row label="Next Run" value={formatMs(job.state?.nextRunAtMs)} />
          {job.state?.lastRunAtMs != null && (
            <Row label="Last Run" value={formatMs(job.state.lastRunAtMs)} />
          )}
          {job.state?.lastRunStatus != null && (
            <Row
              label="Last Run Status"
              value={String(job.state.lastRunStatus)}
            />
          )}
          <Row
            label="Delete After Run"
            value={job.deleteAfterRun ? "Yes" : "No"}
          />
          <Row label="Created" value={formatMs(job.createdAtMs)} />
          <Row label="Updated" value={formatMs(job.updatedAtMs)} />
        </div>
      )}
    </div>
  );
}

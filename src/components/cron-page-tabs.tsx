"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CronJobCard } from "@/components/cron-job-card";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { ClockIcon, PlayIcon, ChevronDownIcon } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import type { AgentConfig, CronJob, CronRun } from "@/lib/types";
import { getPlural } from "@/lib/utils";

export function CronPageTabs({
  jobs,
  runs,
  agents,
  lastUpdatedAt,
}: {
  jobs: CronJob[];
  runs: CronRun[];
  agents: AgentConfig[];
  lastUpdatedAt: string;
}) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);
  const agentById = Object.fromEntries(agents.map((a) => [a.id, a]));
  const jobById = Object.fromEntries(jobs.map((j) => [j.id, j]));

  return (
    <Container>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-semibold tracking-tight">Cron Jobs</h1>
          <p className="text-muted-foreground text-sm">
            All scheduled cron jobs and their run history.
          </p>
        </div>
        <span className="text-muted-foreground text-xs">
          Updated {formatDistanceToNow(new Date(lastUpdatedAt), { addSuffix: true })}
        </span>
      </div>

      <Tabs defaultValue="scheduled">
        <div className="flex items-center justify-between gap-4">
          <TabsList className="mb-1 max-w-[220px]">
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="runs">Runs</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <span className="font-medium">{jobs.length}</span>
              <span className="text-muted-foreground tabular-nums">
                {getPlural("job", "jobs", jobs.length)} scheduled
              </span>
            </div>
            <span className="text-muted-foreground">&middot;</span>
            <div className="flex items-center gap-1">
              <span className="font-medium">{runs.length}</span>
              <span className="text-muted-foreground tabular-nums">
                {getPlural("run", "runs", runs.length)} recorded
              </span>
            </div>
          </div>
        </div>

        <TabsContent value="scheduled">
          {jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
              <div className="bg-muted rounded-full p-3">
                <ClockIcon className="text-muted-foreground size-6" />
              </div>
              <div>
                <p className="text-sm font-medium">No cron jobs</p>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  Scheduled jobs will appear here once created.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {jobs.map((job) => (
                <CronJobCard key={job.id} job={job} agent={agentById[job.sessionTarget]} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="runs">
          {runs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
              <div className="bg-muted rounded-full p-3">
                <PlayIcon className="text-muted-foreground size-6" />
              </div>
              <div>
                <p className="text-sm font-medium">No runs</p>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  Cron run history will appear here after jobs execute.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {runs.map((run, i) => (
                <CronRunCard
                  key={`${run.jobId}-${run.finishedAtMs}-${i}`}
                  run={run}
                  jobName={jobById[run.jobId]?.name}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Container>
  );
}

function RunDetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-2 border-b py-1.5 text-sm last:border-0">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-mono text-xs break-all">{value}</span>
    </div>
  );
}

function CronRunCard({ run, jobName }: { run: CronRun; jobName?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-card overflow-hidden rounded-lg border">
      <button
        onClick={() => setOpen((o) => !o)}
        className="hover:bg-muted/50 flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-3.5 text-left transition-colors"
      >
        <div className="flex min-w-0 items-center gap-3">
          <Badge variant={run.status === "ok" ? "success" : "destructive"} className="shrink-0">
            {run.status}
          </Badge>
          <div className="flex flex-col">
            <span className="truncate text-sm font-medium">
              <p>{run.summary}</p>
              <p className="text-muted-foreground text-xs">{jobName ?? run.jobId}</p>
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-xs">
          <span className="text-muted-foreground tabular-nums">
            {(run.durationMs / 1000).toFixed(1)}s
          </span>
          <span className="text-muted-foreground hidden sm:block">
            {format(run.runAtMs, "MMM d, yyyy, h:mm a")}
          </span>
          <ChevronDownIcon
            className={`text-muted-foreground size-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {open && (
        <div className="border-t px-4 pt-3 pb-4">
          <RunDetailRow label="Job ID" value={run.jobId} />
          {jobName && <RunDetailRow label="Job Name" value={jobName} />}
          <RunDetailRow label="Status" value={run.status} />
          {run.summary && <RunDetailRow label="Summary" value={run.summary} />}
          <RunDetailRow label="Run At" value={format(run.runAtMs, "MMM d, yyyy, h:mm a")} />
          <RunDetailRow
            label="Finished At"
            value={format(run.finishedAtMs, "MMM d, yyyy, h:mm a")}
          />
          <RunDetailRow label="Duration" value={`${(run.durationMs / 1000).toFixed(2)}s`} />
          {run.nextRunAtMs != null && (
            <RunDetailRow label="Next Run" value={format(run.nextRunAtMs, "MMM d, yyyy, h:mm a")} />
          )}
        </div>
      )}
    </div>
  );
}

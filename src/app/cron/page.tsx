import type { Metadata } from "next";
import { getCronJobs, getCronRuns, getAgents } from "@/lib/openclaw";
import { loadOrRedirectOnError } from "@/lib/server-page-error";
import { CronPageTabs } from "@/components/cron-page-tabs";
import { PageBreadcrumb } from "@/components/page-breadcrumb";

export const metadata: Metadata = { title: "Cron Jobs | Claw Control" };
export const dynamic = "force-dynamic";

export default function CronJobsPage() {
  const jobs = loadOrRedirectOnError(() => getCronJobs(), {
    context: "loading cron job configuration",
    retryPath: "/cron",
  });
  const runs = loadOrRedirectOnError(() => getCronRuns(), {
    context: "loading cron run history",
    retryPath: "/cron",
  });
  const agents = loadOrRedirectOnError(() => getAgents(), {
    context: "loading agent configuration for cron jobs",
    retryPath: "/cron",
  });
  const lastUpdatedAt = new Date().toISOString();

  return (
    <>
      <PageBreadcrumb page="Cron Jobs" />
      <CronPageTabs jobs={jobs} runs={runs} agents={agents} lastUpdatedAt={lastUpdatedAt} />
    </>
  );
}

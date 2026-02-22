import type { Metadata } from "next";
import { getCronJobs, getCronRuns, getAgents } from "@/lib/openclaw";
import { CronPageTabs } from "@/components/cron-page-tabs";
import { PageBreadcrumb } from "@/components/page-breadcrumb";

export const metadata: Metadata = { title: "Cron Jobs | Claw Control" };
export const dynamic = "force-dynamic";

export default function CronJobsPage() {
  const jobs = getCronJobs();
  const runs = getCronRuns();
  const agents = getAgents();
  const lastUpdatedAt = new Date().toISOString();

  return (
    <>
      <PageBreadcrumb page="Cron Jobs" />
      <CronPageTabs jobs={jobs} runs={runs} agents={agents} lastUpdatedAt={lastUpdatedAt} />
    </>
  );
}

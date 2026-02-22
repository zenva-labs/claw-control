import type { Metadata } from "next";
import { getUsageData } from "@/lib/openclaw";
import { UsageDashboard } from "@/components/usage-dashboard";
import { Container } from "@/components/ui/container";
import { PageBreadcrumb } from "@/components/page-breadcrumb";

export const metadata: Metadata = { title: "Usage | Claw Control" };
export const dynamic = "force-dynamic";

export default function UsagePage() {
  const records = getUsageData();

  return (
    <Container>
      <PageBreadcrumb page="Usage" />
      <div className="space-y-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Usage</h1>
          <p className="text-sm text-muted-foreground">
            OpenClaw usage metrics for all agents.
          </p>
        </div>
        <UsageDashboard records={records} />
      </div>
    </Container>
  );
}

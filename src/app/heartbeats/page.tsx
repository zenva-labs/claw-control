import type { Metadata } from "next";
import { getHeartbeatStatus } from "@/lib/data";
import { loadOrRedirectOnError } from "@/lib/server-page-error";
import { HeartbeatsPageClient } from "@/components/heartbeats-page-client";
import { PageBreadcrumb } from "@/components/page-breadcrumb";

export const metadata: Metadata = { title: "Heartbeats | Claw Control" };
export const dynamic = "force-dynamic";

export default function HeartbeatsPage() {
  const status = loadOrRedirectOnError(() => getHeartbeatStatus(), {
    context: "loading heartbeat status",
    retryPath: "/heartbeats",
  });
  const lastUpdatedAt = new Date().toISOString();

  return (
    <>
      <PageBreadcrumb page="Heartbeats" />
      <HeartbeatsPageClient status={status} lastUpdatedAt={lastUpdatedAt} />
    </>
  );
}

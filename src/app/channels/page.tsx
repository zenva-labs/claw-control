import type { Metadata } from "next";

import { ChannelsPageContent } from "@/components/channels-page";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { getChannelsStatus } from "@/lib/openclaw";
import { loadOrRedirectOnError } from "@/lib/server-page-error";

export const metadata: Metadata = { title: "Channels | Claw Control" };
export const dynamic = "force-dynamic";

export default function ChannelsPage() {
  const status = loadOrRedirectOnError(() => getChannelsStatus(), {
    context: "loading channel configuration",
    retryPath: "/channels",
  });
  const lastUpdatedAt = new Date().toISOString();

  return (
    <>
      <PageBreadcrumb page="Channels" />
      <ChannelsPageContent status={status} lastUpdatedAt={lastUpdatedAt} />
    </>
  );
}

import type { Metadata } from "next";
import { getGatewayInfo, getPairedDevices, getActiveSessions } from "@/lib/openclaw";
import { loadOrRedirectOnError } from "@/lib/server-page-error";
import { GatewayPageTabs } from "@/components/gateway-page-tabs";

export const metadata: Metadata = { title: "Gateway | Claw Control" };
export const dynamic = "force-dynamic";

const VALID_TABS = ["overview", "instances", "sessions"] as const;
type GatewayTab = (typeof VALID_TABS)[number];

export default async function GatewayPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab: GatewayTab = VALID_TABS.includes(tab as GatewayTab)
    ? (tab as GatewayTab)
    : "overview";

  const info = loadOrRedirectOnError(() => getGatewayInfo(), {
    context: "loading gateway configuration",
    retryPath: "/gateway",
  });
  const devices = loadOrRedirectOnError(() => getPairedDevices(), {
    context: "loading paired device list",
    retryPath: "/gateway",
  });
  const sessions = loadOrRedirectOnError(() => getActiveSessions(), {
    context: "loading active gateway sessions",
    retryPath: "/gateway",
  });

  return (
    <GatewayPageTabs info={info} devices={devices} sessions={sessions} activeTab={activeTab} />
  );
}

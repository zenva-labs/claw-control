import type { Metadata } from "next";
import { getGatewayInfo, getPairedDevices, getActiveSessions } from "@/lib/openclaw";
import { GatewayPageTabs } from "@/components/gateway-page-tabs";

export const metadata: Metadata = { title: "Gateway" };
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

  const info = getGatewayInfo();
  const devices = getPairedDevices();
  const sessions = getActiveSessions();

  return (
    <GatewayPageTabs info={info} devices={devices} sessions={sessions} activeTab={activeTab} />
  );
}

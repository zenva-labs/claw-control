"use client";

import { SessionMessages } from "@/components/session-messages";
import type { SessionMessage } from "@/lib/types";

export function SessionChat({
  agentName,
  messages,
}: {
  agentName: string;
  messages: SessionMessage[];
}) {
  return <SessionMessages agentName={agentName} messages={messages} />;
}

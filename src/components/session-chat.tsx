"use client";

import { SessionMessages } from "@/components/session-messages";
import type { SessionMessage } from "@/lib/types";

export function SessionChat({ messages }: { messages: SessionMessage[] }) {
  return <SessionMessages messages={messages} />;
}

"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

type Status = "checking" | "online" | "offline";

const getBadgeVariant = (status: Status) => {
  switch (status) {
    case "online":
      return "success";
    case "offline":
      return "danger";
  }
  return "secondary";
};

export function GatewayHealthBadge() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/gateway/health", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) setStatus(data.status === "online" ? "online" : "offline");
      } catch {
        if (!cancelled) setStatus("offline");
      }
    }

    check();
    const interval = setInterval(check, 15_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <Badge variant={getBadgeVariant(status)} showDot>
      Gateway {status === "online" ? "Online" : status === "offline" ? "Offline" : "Loading"}
    </Badge>
  );
}

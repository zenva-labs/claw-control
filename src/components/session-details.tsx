"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ParsedSession } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { SetBreadcrumbs } from "@/components/breadcrumb-provider";
import {
  NavTabs,
  NavTabsContent,
  NavTabsList,
  NavTabsTrigger,
} from "@/components/ui/nav-tabs";
import { Container } from "@/components/ui/container";
import { SessionChat } from "@/components/session-chat";
import { SessionMetrics } from "@/components/session-metrics";
import { statusVariant, getStatusLabel } from "@/lib/session-utils";
import { Button } from "./ui/button";
import { ArrowDown } from "lucide-react";
import { format } from "date-fns";

const POLL_INTERVAL = 2000;

export function SessionDetails({
  agentId,
  agentName,
  sessionId,
  initialSession,
  activeTab,
}: {
  agentId: string;
  agentName: string;
  sessionId: string;
  initialSession: ParsedSession;
  activeTab: string;
}) {
  const [session, setSession] = useState(initialSession);
  const router = useRouter();
  const pathname = usePathname();

  const handleTabChange = (tab: string) => {
    router.push(`${pathname}?tab=${tab}`, { scroll: false });
  };
  const isActive = session.status === "active";
  const prevMessageCount = useRef(initialSession.messages.length);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents/${agentId}/sessions/${sessionId}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data: ParsedSession = await res.json();
      setSession(data);
    } catch {
      // silently ignore fetch errors
    }
  }, [agentId, sessionId]);

  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(fetchSession, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [isActive, fetchSession]);

  useEffect(() => {
    if (session.messages.length > prevMessageCount.current) {
      prevMessageCount.current = session.messages.length;
      requestAnimationFrame(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        });
      });
    }
  }, [session.messages.length]);

  return (
    <NavTabs value={activeTab} onValueChange={handleTabChange}>
      <SetBreadcrumbs>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Agents</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/agents/${agentId}`}>
                {agentName}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-mono text-xs">
                {sessionId.slice(0, 8)}...
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </SetBreadcrumbs>
      <div className="border-b mb-3">
        <Container>
          <div className="flex items-center justify-between gap-3 mb-1 flex-wrap mt-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-semibold tracking-tight font-mono">
                {sessionId}
              </h1>
            </div>
            <div className="flex items-center gap-1">
              {session.model && (
                <Badge variant="outline" className="font-mono text-[11px]">
                  {session.provider}/{session.model}
                </Badge>
              )}
              <Badge
                variant={statusVariant(session.status)}
                className="text-[11px]"
              >
                {getStatusLabel(session.status)}
              </Badge>
            </div>
          </div>

          <div className="flex gap-4 text-xs text-muted-foreground mb-2 flex-wrap">
            {session.startedAt && (
              <span>
                Started{" "}
                {format(new Date(session.startedAt), "MMM d, yyyy, h:mm a")}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <NavTabsList className="mb-0.5">
              <NavTabsTrigger value="chat">Chat</NavTabsTrigger>
              <NavTabsTrigger value="metrics">Metrics</NavTabsTrigger>
            </NavTabsList>
            {activeTab === "chat" && (
              <Button
                variant="link"
                size="sm"
                onClick={scrollToBottom}
                title="Scroll to bottom"
                className="-mr-3"
              >
                Scroll to bottom <ArrowDown className="size-4" />
              </Button>
            )}
          </div>
        </Container>
      </div>

      <NavTabsContent value="chat">
        <Container>
          <SessionChat messages={session.messages} />
        </Container>
      </NavTabsContent>

      <NavTabsContent value="metrics">
        <Container>
          <SessionMetrics messages={session.messages} />
        </Container>
      </NavTabsContent>
    </NavTabs>
  );
}

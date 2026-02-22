"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { statusVariant, getStatusLabel } from "@/lib/session-utils";
import { format } from "date-fns";

type SessionRow = {
  id: string;
  agentId: string;
  agentName: string;
  status: string;
  messageCount: number;
  totalCost: number;
  startedAt?: string;
  lastUserMessage?: string;
};

type SortKey = "agent" | "status" | "started" | "cost";
type SortDir = "asc" | "desc";

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "MMM d, yyyy, h:mm a");
  } catch {
    return iso;
  }
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active)
    return <ArrowUpDown className="size-3 text-muted-foreground/50" />;
  return dir === "asc" ? (
    <ArrowUp className="size-3" />
  ) : (
    <ArrowDown className="size-3" />
  );
}

export function SessionsTable({
  sessions,
  showAgent = true,
}: {
  sessions: SessionRow[];
  showAgent?: boolean;
}) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>("started");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "started" || key === "cost" ? "desc" : "asc");
    }
  };

  const sorted = useMemo(() => {
    const rows = [...sessions];
    const dir = sortDir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      switch (sortKey) {
        case "agent":
          return dir * a.agentName.localeCompare(b.agentName);
        case "status":
          return dir * a.status.localeCompare(b.status);
        case "started": {
          const activeA = a.status === "active" ? 0 : 1;
          const activeB = b.status === "active" ? 0 : 1;
          if (activeA !== activeB) return activeA - activeB;
          const ta = a.startedAt ? new Date(a.startedAt).getTime() : 0;
          const tb = b.startedAt ? new Date(b.startedAt).getTime() : 0;
          return dir * (ta - tb);
        }
        case "cost":
          return dir * (a.totalCost - b.totalCost);
        default:
          return 0;
      }
    });
    return rows;
  }, [sessions, sortKey, sortDir]);

  const navigateToSession = useCallback(
    (agentId: string, sessionId: string) => {
      router.push(`/agents/${agentId}/sessions/${sessionId}`);
    },
    [router],
  );

  const headerButton = (key: SortKey, label: string, className?: string) => (
    <button
      onClick={() => toggleSort(key)}
      className={`flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer ${className ?? ""}`}
    >
      {label}
      <SortIcon active={sortKey === key} dir={sortDir} />
    </button>
  );

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[160px]">Session</TableHead>
            {showAgent && (
              <TableHead className="w-[140px]">
                {headerButton("agent", "Agent")}
              </TableHead>
            )}
            <TableHead className="w-[80px]">
              {headerButton("status", "Status")}
            </TableHead>
            <TableHead className="w-[90px] text-right">Messages</TableHead>
            <TableHead className="w-[100px]">
              {headerButton("cost", "Cost", "ml-auto")}
            </TableHead>
            <TableHead className="w-[180px]">
              {headerButton("started", "Started")}
            </TableHead>
            <TableHead>Preview</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((session) => (
            <TableRow
              key={`${session.agentId}-${session.id}`}
              className="cursor-pointer"
              onClick={() => navigateToSession(session.agentId, session.id)}
            >
              <TableCell>
                <span className="font-mono text-xs">
                  {session.id.slice(0, 8)}...
                </span>
              </TableCell>
              {showAgent && (
                <TableCell>
                  <Link
                    href={`/agents/${session.agentId}`}
                    className="text-xs hover:underline text-muted-foreground relative z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {session.agentName}
                  </Link>
                </TableCell>
              )}
              <TableCell>
                <Badge
                  variant={statusVariant(session.status)}
                  className="text-[10px]"
                >
                  {getStatusLabel(session.status)}
                </Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums text-sm">
                {session.messageCount}
              </TableCell>
              <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                {session.totalCost > 0
                  ? `$${session.totalCost.toFixed(4)}`
                  : "—"}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {formatDate(session.startedAt)}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground truncate max-w-[300px]">
                {session.lastUserMessage || "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

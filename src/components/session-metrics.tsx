"use client";

import { useMemo } from "react";
import type { SessionMessage } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

function BarRow({
  label,
  value,
  max,
  className,
}: {
  label: string;
  value: number;
  max: number;
  className?: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-start gap-3">
      <span className="text-sm text-muted-foreground w-28 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-6 bg-muted/50 rounded-sm overflow-hidden">
        <div
          className={cn("h-full rounded-sm transition-all", className)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm tabular-nums w-20 font-medium text-right">
        {value.toLocaleString()}
      </span>
    </div>
  );
}

export function SessionMetrics({ messages }: { messages: SessionMessage[] }) {
  const stats = useMemo(() => {
    let inputTokens = 0;
    let outputTokens = 0;
    let cachedTokens = 0;
    let totalCost = 0;
    let userMessages = 0;
    let assistantMessages = 0;
    let systemMessages = 0;
    let toolCalls = 0;
    const toolCountMap = new Map<string, number>();

    for (const m of messages) {
      if (m.usage) {
        inputTokens += m.usage.input;
        outputTokens += m.usage.output;
        cachedTokens += m.usage.cacheRead;
        totalCost += m.usage.cost ?? 0;
      }

      if (m.role === "user") {
        const text = m.content.find((b) => b.type === "text")?.text || "";
        if (text.includes("[System Message]")) {
          systemMessages++;
        } else if (!text.startsWith("A new session was started")) {
          userMessages++;
        }
      } else if (m.role === "assistant") {
        assistantMessages++;
        for (const block of m.content) {
          if (block.type === "toolCall") {
            toolCalls++;
            const name = block.toolName || "unknown";
            toolCountMap.set(name, (toolCountMap.get(name) || 0) + 1);
          }
        }
      }
    }

    const toolBreakdown = Array.from(toolCountMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      inputTokens,
      outputTokens,
      cachedTokens,
      totalTokens: inputTokens + outputTokens,
      totalCost,
      userMessages,
      assistantMessages,
      systemMessages,
      totalMessages: userMessages + assistantMessages + systemMessages,
      toolCalls,
      toolBreakdown,
    };
  }, [messages]);

  const tokenMax = Math.max(
    stats.inputTokens,
    stats.outputTokens,
    stats.cachedTokens,
  );
  const msgMax = Math.max(
    stats.userMessages,
    stats.assistantMessages,
    stats.systemMessages,
  );
  const toolMax = stats.toolBreakdown[0]?.count ?? 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent>
            <div className="text-sm text-muted-foreground">Total Tokens</div>
            <div className="text-2xl font-bold tabular-nums mt-1">
              {stats.totalTokens.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-sm text-muted-foreground">Messages</div>
            <div className="text-2xl font-bold tabular-nums mt-1">
              {stats.totalMessages.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-sm text-muted-foreground">Tool Calls</div>
            <div className="text-2xl font-bold tabular-nums mt-1">
              {stats.toolCalls.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        {stats.totalCost > 0 && (
          <Card>
            <CardContent>
              <div className="text-sm text-muted-foreground">Total Cost</div>
              <div className="text-2xl font-bold tabular-nums mt-1">
                ${stats.totalCost.toFixed(4)}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Token Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <BarRow
              label="Input"
              value={stats.inputTokens}
              max={tokenMax}
              className="bg-blue-500/70"
            />
            <BarRow
              label="Output"
              value={stats.outputTokens}
              max={tokenMax}
              className="bg-emerald-500/70"
            />
            <BarRow
              label="Cached Input"
              value={stats.cachedTokens}
              max={tokenMax}
              className="bg-amber-500/70"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Message Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <BarRow
              label="User"
              value={stats.userMessages}
              max={msgMax}
              className="bg-blue-500/70"
            />
            <BarRow
              label="Assistant"
              value={stats.assistantMessages}
              max={msgMax}
              className="bg-emerald-500/70"
            />
            <BarRow
              label="System"
              value={stats.systemMessages}
              max={msgMax}
              className="bg-purple-500/70"
            />
          </CardContent>
        </Card>
      </div>

      {stats.toolBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tool Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tool</TableHead>
                  <TableHead className="w-48">Distribution</TableHead>
                  <TableHead className="text-right w-20">Calls</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.toolBreakdown.map((tool) => (
                  <TableRow key={tool.name}>
                    <TableCell className="font-mono text-sm">
                      {tool.name}
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-muted/50 rounded-sm overflow-hidden">
                        <div
                          className="h-full bg-foreground/20 rounded-sm"
                          style={{
                            width: `${toolMax > 0 ? (tool.count / toolMax) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {tool.count.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UsageRecord } from "@/lib/types";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";
import { getModelColor } from "@/lib/utils";

type TimeRange = "today" | "week" | "7d" | "30d" | "all";

const RANGE_LABELS: Record<TimeRange, string> = {
  today: "Today",
  week: "This Week",
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  all: "All Time",
};

function getRangeCutoff(range: TimeRange): number {
  if (range === "all") return 0;
  const now = new Date();
  if (range === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start.getTime();
  }
  if (range === "week") {
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    return monday.getTime();
  }
  const days = range === "7d" ? 7 : 30;
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);
  return cutoff.getTime();
}

function formatDateRange(range: TimeRange, records: UsageRecord[]): string {
  const now = new Date();

  if (range === "today") {
    return format(now, "MMM d, yyyy");
  }

  if (range === "all") {
    if (records.length === 0) return "No data";
    const earliest = new Date(records[0].timestamp);
    return `${format(earliest, "MMM d")} – ${format(now, "MMM d, yyyy")}`;
  }

  const cutoff = getRangeCutoff(range);
  const start = new Date(cutoff);
  const sameYear = start.getFullYear() === now.getFullYear();
  return sameYear
    ? `${format(start, "MMM d")} – ${format(now, "MMM d, yyyy")}`
    : `${format(start, "MMM d, yyyy")} – ${format(now, "MMM d, yyyy")}`;
}

function formatCost(n: number): string {
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(4)}`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function dateKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function hourKey(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:00`;
}

export function UsageDashboard({ records }: { records: UsageRecord[] }) {
  const [range, setRange] = useState<TimeRange>("today");

  const filtered = useMemo(() => {
    const cutoff = getRangeCutoff(range);
    if (cutoff === 0) return records;
    return records.filter((r) => r.timestamp >= cutoff);
  }, [records, range]);

  const dateRangeLabel = useMemo(() => formatDateRange(range, records), [range, records]);

  const stats = useMemo(() => {
    let totalCost = 0;
    let totalInput = 0;
    let totalOutput = 0;
    let totalCached = 0;
    const sessions = new Set<string>();
    const modelMap = new Map<
      string,
      {
        input: number;
        output: number;
        cached: number;
        cost: number;
        count: number;
      }
    >();
    const agentMap = new Map<
      string,
      { name: string; cost: number; sessions: Set<string>; count: number }
    >();

    for (const r of filtered) {
      totalCost += r.cost;
      totalInput += r.inputTokens;
      totalOutput += r.outputTokens;
      totalCached += r.cachedTokens;
      sessions.add(r.sessionId);

      const m = modelMap.get(r.model) || {
        input: 0,
        output: 0,
        cached: 0,
        cost: 0,
        count: 0,
      };
      m.input += r.inputTokens;
      m.output += r.outputTokens;
      m.cached += r.cachedTokens;
      m.cost += r.cost;
      m.count++;
      modelMap.set(r.model, m);

      const a = agentMap.get(r.agentId) || {
        name: r.agentName,
        cost: 0,
        sessions: new Set<string>(),
        count: 0,
      };
      a.cost += r.cost;
      a.sessions.add(r.sessionId);
      a.count++;
      agentMap.set(r.agentId, a);
    }

    const modelBreakdown = Array.from(modelMap.entries())
      .map(([model, d]) => ({ model, ...d, totalTokens: d.input + d.output }))
      .sort((a, b) => b.cost - a.cost);

    const agentBreakdown = Array.from(agentMap.entries())
      .map(([id, d]) => ({
        id,
        name: d.name,
        cost: d.cost,
        sessionCount: d.sessions.size,
        requestCount: d.count,
      }))
      .sort((a, b) => b.cost - a.cost);

    return {
      totalCost,
      totalTokens: totalInput + totalOutput,
      totalInput,
      totalOutput,
      totalCached,
      sessionCount: sessions.size,
      avgCostPerSession: sessions.size > 0 ? totalCost / sessions.size : 0,
      modelBreakdown,
      agentBreakdown,
    };
  }, [filtered]);

  // Chart data: hourly (today) or daily cost stacked by model
  const { chartData, chartModels } = useMemo(() => {
    const bucketModelMap = new Map<string, Map<string, number>>();
    const allModels = new Set<string>();

    const keyFn = range === "today" ? hourKey : dateKey;

    for (const r of filtered) {
      const bk = keyFn(r.timestamp);
      if (!bucketModelMap.has(bk)) bucketModelMap.set(bk, new Map());
      const bMap = bucketModelMap.get(bk)!;
      bMap.set(r.model, (bMap.get(r.model) || 0) + r.cost);
      allModels.add(r.model);
    }

    const models = Array.from(allModels).sort();

    let slots: string[];
    if (range === "today") {
      const now = new Date();
      slots = Array.from(
        { length: now.getHours() + 1 },
        (_, h) => `${String(h).padStart(2, "0")}:00`,
      );
    } else if (range === "all") {
      slots = Array.from(bucketModelMap.keys()).sort();
    } else {
      const cutoff = getRangeCutoff(range);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const cursor = new Date(cutoff);
      const acc: string[] = [];
      while (cursor <= today) {
        acc.push(dateKey(cursor.getTime()));
        cursor.setDate(cursor.getDate() + 1);
      }
      slots = acc;
    }

    const data = slots.map((slot) => {
      const entry: Record<string, string | number> = { date: slot };
      const bMap = bucketModelMap.get(slot);
      for (const model of models) {
        entry[model] = +(bMap ? bMap.get(model) || 0 : 0).toFixed(6);
      }
      return entry;
    });

    return { chartData: data, chartModels: models };
  }, [filtered, range]);

  // Model cost distribution bar (horizontal stacked)
  const modelDistribution = useMemo(() => {
    if (stats.totalCost === 0) return [];
    return stats.modelBreakdown.map((m) => ({
      model: m.model,
      pct: (m.cost / stats.totalCost) * 100,
    }));
  }, [stats]);

  return (
    <div className="space-y-3">
      {/* Time range selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Tabs
          value={range}
          onValueChange={(v) => setRange(v as TimeRange)}
          className="flex-1 shrink-0"
        >
          <TabsList className="max-w-[460px]">
            {(Object.keys(RANGE_LABELS) as TimeRange[]).map((key) => (
              <TabsTrigger key={key} value={key}>
                {RANGE_LABELS[key]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="text-muted-foreground shrink-0 text-sm">{dateRangeLabel}</div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <CardContent>
            <div className="text-muted-foreground text-sm">Total Cost</div>
            <div className="mt-1 text-2xl font-bold tabular-nums">
              {formatCost(stats.totalCost)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-muted-foreground text-sm">Total Tokens</div>
            <div className="mt-1 text-2xl font-bold tabular-nums">
              {formatTokens(stats.totalTokens)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-muted-foreground text-sm">Sessions</div>
            <div className="mt-1 text-2xl font-bold tabular-nums">
              {stats.sessionCount.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-muted-foreground text-sm">Avg Cost / Session</div>
            <div className="mt-1 text-2xl font-bold tabular-nums">
              {formatCost(stats.avgCostPerSession)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model distribution bar */}
      {modelDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Cost Distribution by Model</CardTitle>
            <CardAction>
              <span className="text-muted-foreground text-xs">{dateRangeLabel}</span>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="flex h-6 overflow-hidden rounded-sm">
              {modelDistribution.map((m) => (
                <div
                  key={m.model}
                  className="h-full transition-all"
                  style={{
                    width: `${m.pct}%`,
                    backgroundColor: getModelColor(m.model),
                    opacity: 0.8,
                  }}
                  title={`${m.model}: ${m.pct.toFixed(1)}%`}
                />
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              {modelDistribution.map((m) => (
                <div key={m.model} className="flex items-center gap-1.5 text-xs">
                  <div
                    className="size-2.5 shrink-0 rounded-sm"
                    style={{
                      backgroundColor: getModelColor(m.model),
                      opacity: 0.8,
                    }}
                  />
                  <span className="text-muted-foreground font-mono">{m.model}</span>
                  <span className="tabular-nums">{m.pct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily cost chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Daily Cost</CardTitle>
            <CardAction>
              <span className="text-muted-foreground text-xs">{dateRangeLabel}</span>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    stroke="currentColor"
                    opacity={0.4}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="currentColor"
                    opacity={0.4}
                    tickFormatter={(v: number) => `$${v.toFixed(2)}`}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const sorted = [...payload]
                        .filter((entry) => Number(entry.value ?? 0) > 0)
                        .sort((a, b) => Number(b.value ?? 0) - Number(a.value ?? 0));
                      if (!sorted.length) return null;
                      const total = sorted.reduce(
                        (sum, entry) => sum + Number(entry.value ?? 0),
                        0,
                      );
                      return (
                        <div
                          style={{
                            backgroundColor: "var(--background)",
                            color: "var(--foreground)",
                            border: "1px solid var(--border)",
                            borderRadius: "0.5rem",
                            fontSize: "12px",
                            boxShadow: "0 4px 12px rgba(0,0,0,.15)",
                            padding: "8px 12px",
                          }}
                        >
                          <p style={{ marginBottom: 4, fontWeight: 600 }}>{label}</p>
                          {sorted.map((entry) => (
                            <div
                              key={String(entry.name)}
                              style={{ display: "flex", justifyContent: "space-between", gap: 16 }}
                            >
                              <span style={{ color: entry.color }}>{String(entry.name)}</span>
                              <span style={{ fontVariantNumeric: "tabular-nums" }}>
                                {formatCost(Number(entry.value ?? 0))}
                              </span>
                            </div>
                          ))}
                          {sorted.length > 1 && (
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 16,
                                marginTop: 4,
                                paddingTop: 4,
                                borderTop: "1px solid var(--border)",
                                fontWeight: 600,
                              }}
                            >
                              <span>Total</span>
                              <span style={{ fontVariantNumeric: "tabular-nums" }}>
                                {formatCost(total)}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />
                  {chartModels.length > 1 && (
                    <Legend wrapperStyle={{ fontSize: "11px" }} iconSize={10} />
                  )}
                  {chartModels.map((model, i) => (
                    <Bar
                      key={model}
                      dataKey={model}
                      stackId="cost"
                      fill={getModelColor(model)}
                      opacity={0.8}
                      isAnimationActive={false}
                      radius={i === chartModels.length - 1 ? [2, 2, 0, 0] : undefined}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost by model */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Cost by Model</CardTitle>
          <CardAction>
            <span className="text-muted-foreground text-xs">{dateRangeLabel}</span>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead className="w-24 text-right">Input</TableHead>
                <TableHead className="w-24 text-right">Cached</TableHead>
                <TableHead className="w-24 text-right">Output</TableHead>
                <TableHead className="w-24 text-right">Total</TableHead>
                <TableHead className="w-24 text-right">Cost</TableHead>
                <TableHead className="w-14 text-right">%</TableHead>
                <TableHead className="w-20 text-right">Requests</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.modelBreakdown.map((m) => (
                <TableRow key={m.model}>
                  <TableCell className="font-mono text-xs">{m.model}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {m.input.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {m.cached.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {m.output.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium tabular-nums">
                    {m.totalTokens.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium tabular-nums">
                    {formatCost(m.cost)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right text-sm tabular-nums">
                    {stats.totalCost > 0 ? ((m.cost / stats.totalCost) * 100).toFixed(1) : "0"}%
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right text-sm tabular-nums">
                    {m.count.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {stats.modelBreakdown.length > 1 && (
                <TableRow className="font-medium">
                  <TableCell className="text-sm">Total</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {stats.totalInput.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {stats.totalCached.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {stats.totalOutput.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {stats.totalTokens.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {formatCost(stats.totalCost)}
                  </TableCell>
                  <TableCell />
                  <TableCell className="text-muted-foreground text-right text-sm tabular-nums">
                    {filtered.length.toLocaleString()}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cost by agent */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Cost by Agent</CardTitle>
          <CardAction>
            <span className="text-muted-foreground text-xs">{dateRangeLabel}</span>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead className="w-24 text-right">Sessions</TableHead>
                <TableHead className="w-24 text-right">Cost</TableHead>
                <TableHead className="w-16 text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.agentBreakdown.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-sm">{a.name}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {a.sessionCount}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {formatCost(a.cost)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right text-sm tabular-nums">
                    {stats.totalCost > 0 ? ((a.cost / stats.totalCost) * 100).toFixed(1) : "0"}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filtered.length === 0 && (
        <p className="text-muted-foreground py-8 text-center text-sm">
          No usage data for the selected time range.
        </p>
      )}
    </div>
  );
}

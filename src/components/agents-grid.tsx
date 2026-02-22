"use client";

import { useState } from "react";
import Link from "next/link";
import { SparklesIcon, SearchIcon } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getPlural } from "@/lib/utils";
import type { AgentConfig } from "@/lib/types";

type AgentCounts = { active: number; archived: number; total: number };

export function AgentsGrid({
  agents,
  counts,
}: {
  agents: AgentConfig[];
  counts: Record<string, AgentCounts>;
}) {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? agents.filter(
        (a) =>
          a.name.toLowerCase().includes(search.trim().toLowerCase()) ||
          a.id.toLowerCase().includes(search.trim().toLowerCase()) ||
          a.model.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : agents;

  return (
    <div className="space-y-3">
      {agents.length > 0 && (
        <div className="relative w-full">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search agents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <div className="rounded-full bg-muted p-3">
            <SparklesIcon className="size-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-sm">No agents</p>
            <p className="text-muted-foreground text-sm mt-0.5">
              {search.trim()
                ? `No agents match "${search.trim()}".`
                : "No agents have been configured yet."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((agent) => {
            const c = counts[agent.id] || { active: 0, archived: 0, total: 0 };
            return (
              <Link key={agent.id} href={`/agents/${agent.id}`}>
                <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{agent.name}</CardTitle>
                      {agent.default && (
                        <Badge variant="secondary" className="text-[10px]">
                          default
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="font-mono text-xs">
                      {agent.id}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 text-sm">
                      <Badge
                        variant="outline"
                        className="font-mono text-[11px]"
                      >
                        {agent.model}
                      </Badge>
                    </div>
                    <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                      <span>
                        <span className="font-medium text-foreground">
                          {c.active}
                        </span>{" "}
                        active {getPlural("session", "sessions", c.active)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

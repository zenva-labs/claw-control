import fs from "fs";
import os from "os";
import path from "path";
import type {
  AgentConfig,
  CronJob,
  CronRun,
  GatewayInfo,
  HeartbeatStatus,
  HeartbeatLogEntry,
  PairedDevice,
  SessionSummary,
  ParsedSession,
  SessionMessage,
  ContentBlock,
  UsageRecord,
  ResolvedSkill,
  ResolvedTool,
} from "./types";

const OPENCLAW_DIR = process.env.OPENCLAW_DIR || path.join(os.homedir(), ".openclaw");

function resolveHomePath(value: string): string {
  if (value.startsWith("~/")) return path.join(os.homedir(), value.slice(2));
  return value;
}

function getSessionContextMap(
  agentId: string,
): Map<string, { totalTokens: number; contextTokens: number }> {
  const map = new Map<string, { totalTokens: number; contextTokens: number }>();
  try {
    const sessionsJsonPath = path.join(
      OPENCLAW_DIR,
      "agents",
      agentId,
      "sessions",
      "sessions.json",
    );
    if (fs.existsSync(sessionsJsonPath)) {
      const data = JSON.parse(fs.readFileSync(sessionsJsonPath, "utf-8"));
      for (const entry of Object.values(data) as Record<string, unknown>[]) {
        const sid = entry.sessionId as string | undefined;
        if (sid) {
          map.set(sid, {
            totalTokens: (entry.totalTokens as number) || 0,
            contextTokens: (entry.contextTokens as number) || 0,
          });
        }
      }
    }
  } catch {
    /* ignore */
  }
  return map;
}

export function getAgents(): AgentConfig[] {
  const configPath = path.join(OPENCLAW_DIR, "openclaw.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  const defaultModel = config.agents?.defaults?.model?.primary || "unknown";
  const defaultWorkspace = config.agents?.defaults?.workspace;
  return config.agents.list.map((a: Record<string, unknown>) => ({
    id: a.id,
    name: a.name,
    model: a.model || defaultModel,
    workspace: a.workspace || defaultWorkspace,
    default: a.default,
    subagents: a.subagents,
  }));
}

export function getSkillsForAgent(agentId: string): ResolvedSkill[] {
  let configuredSkillNames: string[] = [];
  let configuredWorkspace: string | undefined;

  try {
    const configPath = path.join(OPENCLAW_DIR, "openclaw.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8")) as {
      agents?: {
        defaults?: { workspace?: string; skills?: unknown };
        list?: Array<{ id?: string; workspace?: string; skills?: unknown }>;
      };
    };
    const agentConfig = (config.agents?.list ?? []).find((entry) => entry.id === agentId);
    const defaultSkillsRaw = config.agents?.defaults?.skills;
    const defaultSkills = Array.isArray(defaultSkillsRaw)
      ? defaultSkillsRaw.filter((skill): skill is string => typeof skill === "string")
      : [];
    const agentSkillsRaw = agentConfig?.skills;
    const agentSkills = Array.isArray(agentSkillsRaw)
      ? agentSkillsRaw.filter((skill): skill is string => typeof skill === "string")
      : [];
    configuredSkillNames = [...new Set([...defaultSkills, ...agentSkills])];
    const workspace = agentConfig?.workspace ?? config.agents?.defaults?.workspace;
    configuredWorkspace = workspace ? resolveHomePath(workspace) : undefined;
  } catch {
    /* ignore config parse errors */
  }

  let resolvedSkills: ResolvedSkill[] = [];

  try {
    const sessionsPath = path.join(OPENCLAW_DIR, "agents", agentId, "sessions", "sessions.json");
    if (!fs.existsSync(sessionsPath)) {
      resolvedSkills = [];
    } else {
      const data = JSON.parse(fs.readFileSync(sessionsPath, "utf-8")) as Record<string, unknown>;

      type SkillsEntry = {
        updatedAt?: number;
        skillsSnapshot?: { resolvedSkills?: ResolvedSkill[] };
      };

      let latest: SkillsEntry | null = null;
      for (const entry of Object.values(data) as SkillsEntry[]) {
        if (entry.updatedAt && (!latest || !latest.updatedAt || entry.updatedAt > latest.updatedAt)) {
          latest = entry;
        }
      }

      resolvedSkills = (latest?.skillsSnapshot?.resolvedSkills ?? []).map((s: ResolvedSkill) => ({
        name: s.name,
        description: s.description,
        source: s.source,
        filePath: s.filePath,
        disableModelInvocation: s.disableModelInvocation ?? false,
      }));
    }
  } catch {
    /* ignore session parse errors */
  }

  const mergedByName = new Map<string, ResolvedSkill>();
  for (const skill of resolvedSkills) {
    mergedByName.set(skill.name, skill);
  }

  for (const name of configuredSkillNames) {
    const existing = mergedByName.get(name);
    if (existing) {
      mergedByName.set(name, { ...existing, disableModelInvocation: false });
      continue;
    }

    const workspaceSkillPath = configuredWorkspace
      ? path.join(configuredWorkspace, "skills", name, "SKILL.md")
      : undefined;
    const isWorkspaceSkill = workspaceSkillPath ? fs.existsSync(workspaceSkillPath) : false;

    mergedByName.set(name, {
      name,
      description: isWorkspaceSkill
        ? "Workspace skill enabled in openclaw.json."
        : "Built-in OpenClaw skill enabled in openclaw.json.",
      source: isWorkspaceSkill ? "openclaw-workspace" : "openclaw-built-in",
      filePath: isWorkspaceSkill ? workspaceSkillPath : undefined,
      disableModelInvocation: false,
    });
  }

  return [...mergedByName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

const TOOL_META: Record<string, { description: string; category: string }> = {
  read: { description: "Read file contents", category: "Files" },
  write: { description: "Create or overwrite files", category: "Files" },
  edit: { description: "Make precise edits", category: "Files" },
  apply_patch: { description: "Apply multi-file patches", category: "Files" },
  grep: { description: "Search file contents", category: "Files" },
  find: { description: "Find files by glob pattern", category: "Files" },
  ls: { description: "List directory contents", category: "Files" },
  exec: { description: "Run shell commands", category: "Runtime" },
  process: { description: "Manage background processes", category: "Runtime" },
  web_search: { description: "Search the web", category: "Web" },
  web_fetch: { description: "Fetch web content", category: "Web" },
  browser: { description: "Control web browser", category: "Web" },
  canvas: {
    description: "Present/eval/snapshot the Canvas",
    category: "Media",
  },
  image: { description: "Analyze images", category: "Media" },
  tts: { description: "Text-to-speech", category: "Media" },
  nodes: { description: "Manage paired nodes", category: "Infrastructure" },
  cron: { description: "Manage cron jobs", category: "Infrastructure" },
  gateway: {
    description: "Manage gateway process",
    category: "Infrastructure",
  },
  message: { description: "Send messages", category: "Messaging" },
  agents_list: { description: "List available agents", category: "Sessions" },
  sessions_list: { description: "List sessions", category: "Sessions" },
  sessions_history: {
    description: "Fetch session history",
    category: "Sessions",
  },
  sessions_send: {
    description: "Send to another session",
    category: "Sessions",
  },
  sessions_spawn: {
    description: "Spawn a sub-agent session",
    category: "Sessions",
  },
  subagents: { description: "Manage sub-agent runs", category: "Sessions" },
  session_status: { description: "Show session status", category: "Sessions" },
  memory_search: {
    description: "Semantic search memories",
    category: "Memory",
  },
  memory_get: { description: "Read memory files", category: "Memory" },
};

export function getToolsForAgent(agentId: string): ResolvedTool[] {
  try {
    const sessionsPath = path.join(OPENCLAW_DIR, "agents", agentId, "sessions", "sessions.json");
    if (!fs.existsSync(sessionsPath)) return [];
    const data = JSON.parse(fs.readFileSync(sessionsPath, "utf-8"));

    type SessionEntry = {
      updatedAt?: number;
      systemPromptReport?: {
        tools?: {
          entries?: { name: string; propertiesCount: number }[];
        };
      };
    };

    let latest: SessionEntry | null = null;
    for (const entry of Object.values(data) as SessionEntry[]) {
      if (entry.updatedAt && (!latest || !latest.updatedAt || entry.updatedAt > latest.updatedAt)) {
        latest = entry;
      }
    }

    return (latest?.systemPromptReport?.tools?.entries ?? []).map((t) => {
      const meta = TOOL_META[t.name];
      return {
        name: t.name,
        description: meta?.description ?? t.name,
        category: meta?.category ?? "Other",
        propertiesCount: t.propertiesCount,
      };
    });
  } catch {
    return [];
  }
}

function parseFilename(file: string): {
  id: string;
  status: "active" | "reset" | "deleted";
  archivedAt?: string;
} | null {
  if (file === "sessions.json") return null;

  if (file.endsWith(".jsonl") && !file.includes(".jsonl.")) {
    return { id: file.replace(".jsonl", ""), status: "active" };
  }
  if (file.includes(".jsonl.reset.")) {
    const [id, ts] = file.split(".jsonl.reset.");
    return { id, status: "reset", archivedAt: ts };
  }
  if (file.includes(".jsonl.deleted.")) {
    const [id, ts] = file.split(".jsonl.deleted.");
    return { id, status: "deleted", archivedAt: ts };
  }
  return null;
}

function extractUserPreview(rawText: string): string | undefined {
  if (rawText.includes("[System Message]")) return undefined;
  if (rawText.startsWith("A new session was started")) return undefined;

  const match = rawText.match(/\[[A-Z][a-z]{2}\s\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}\s\w+\]\s*(.*)/s);
  if (match && !match[1].startsWith("[System Message]")) {
    return match[1].slice(0, 120);
  }

  if (!rawText.startsWith("Conversation info")) {
    return rawText.slice(0, 120);
  }
  return undefined;
}

export function getSessionsForAgent(agentId: string): SessionSummary[] {
  const sessionsDir = path.join(OPENCLAW_DIR, "agents", agentId, "sessions");
  if (!fs.existsSync(sessionsDir)) return [];

  const contextMap = getSessionContextMap(agentId);
  const files = fs.readdirSync(sessionsDir);
  const sessions: SessionSummary[] = [];

  for (const file of files) {
    const parsed = parseFilename(file);
    if (!parsed) continue;

    const fullPath = path.join(sessionsDir, file);
    const stat = fs.statSync(fullPath);

    let messageCount = 0;
    let totalCost = 0;
    let lastUserMessage: string | undefined;
    let startedAt: string | undefined;

    try {
      const content = fs.readFileSync(fullPath, "utf-8");
      const lines = content.trim().split("\n");
      for (const line of lines) {
        try {
          const obj = JSON.parse(line);
          if (obj.type === "session") startedAt = obj.timestamp;
          if (obj.type === "message") {
            const msg = obj.message;
            const role = msg?.role;
            if (role === "user") {
              messageCount++;
              const textBlock = msg.content?.find((c: Record<string, string>) => c.type === "text");
              if (textBlock?.text) {
                lastUserMessage = extractUserPreview(textBlock.text);
              }
            }
            if (role === "assistant") {
              messageCount++;
              if (msg?.usage?.cost?.total) {
                totalCost += msg.usage.cost.total;
              }
            }
          }
        } catch {
          /* skip malformed lines */
        }
      }
    } catch {
      /* skip unreadable files */
    }

    const ctx = contextMap.get(parsed.id);
    sessions.push({
      id: parsed.id,
      agentId,
      status: parsed.status,
      filename: file,
      archivedAt: parsed.archivedAt,
      startedAt,
      modifiedAt: stat.mtime.toISOString(),
      messageCount,
      totalCost,
      lastUserMessage,
      totalTokens: ctx?.totalTokens,
      contextTokens: ctx?.contextTokens,
    });
  }

  return sessions.sort(
    (a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime(),
  );
}

function parseMessageContent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  msg: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any,
): SessionMessage | null {
  if (!msg) return null;
  const ts: number =
    typeof msg.timestamp === "number" ? msg.timestamp : new Date(obj.timestamp).getTime();

  if (msg.role === "user") {
    const blocks: ContentBlock[] = (msg.content || [])
      .filter((c: Record<string, string>) => c.type === "text")
      .map((c: Record<string, string>) => ({
        type: "text" as const,
        text: c.text,
      }));
    return { id: obj.id, role: "user", timestamp: ts, content: blocks };
  }

  if (msg.role === "assistant") {
    const blocks: ContentBlock[] = [];
    for (const block of msg.content || []) {
      if (block.type === "text") {
        if (block.text === "NO_REPLY") continue;
        blocks.push({ type: "text", text: block.text });
      }
      if (block.type === "thinking" && block.thinking) {
        blocks.push({ type: "thinking", thinking: block.thinking });
      }
      if (block.type === "toolCall") {
        blocks.push({
          type: "toolCall",
          toolCallId: block.id,
          toolName: block.name,
          toolArguments: block.arguments,
        });
      }
    }
    if (blocks.length === 0) return null;
    return {
      id: obj.id,
      role: "assistant",
      timestamp: ts,
      content: blocks,
      model: msg.model,
      provider: msg.provider,
      usage: msg.usage
        ? {
            input: msg.usage.input || msg.usage.inputTokens || 0,
            output: msg.usage.output || msg.usage.outputTokens || 0,
            cacheRead: msg.usage.cacheRead || 0,
            cost: msg.usage.cost?.total,
          }
        : undefined,
    };
  }

  if (msg.role === "toolResult") {
    const textContent = (msg.content || [])
      .map((c: Record<string, string>) => c.text || JSON.stringify(c))
      .join("\n");
    return {
      id: obj.id,
      role: "toolResult",
      timestamp: ts,
      content: [
        {
          type: "toolResult",
          toolResultContent: textContent,
          isError: msg.isError,
          toolCallId: msg.toolCallId,
          toolName: msg.toolName,
        },
      ],
      toolCallId: msg.toolCallId,
      toolName: msg.toolName,
    };
  }

  return null;
}

export function getSession(agentId: string, sessionId: string): ParsedSession | null {
  const sessionsDir = path.join(OPENCLAW_DIR, "agents", agentId, "sessions");
  if (!fs.existsSync(sessionsDir)) return null;

  const files = fs.readdirSync(sessionsDir);
  let matchedFile: string | undefined;
  let status: "active" | "reset" | "deleted" = "active";
  for (const f of files) {
    const parsed = parseFilename(f);
    if (parsed?.id === sessionId) {
      matchedFile = f;
      status = parsed.status;
      break;
    }
  }
  if (!matchedFile) return null;

  const content = fs.readFileSync(path.join(sessionsDir, matchedFile), "utf-8");
  const lines = content.trim().split("\n");

  let sessionId_: string = sessionId;
  let startedAt = "";
  let model: string | undefined;
  let provider: string | undefined;
  const messages: SessionMessage[] = [];

  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      if (obj.type === "session") {
        sessionId_ = obj.id;
        startedAt = obj.timestamp;
      }
      if (obj.type === "model_change") {
        model = obj.modelId;
        provider = obj.provider;
      }
      if (obj.type === "message") {
        const parsed = parseMessageContent(obj.message, obj);
        if (parsed) messages.push(parsed);
      }
    } catch {
      /* skip */
    }
  }

  const contextMap = getSessionContextMap(agentId);
  const ctx = contextMap.get(sessionId);

  return {
    id: sessionId_,
    status,
    startedAt,
    model,
    provider,
    messages,
    totalTokens: ctx?.totalTokens,
    contextTokens: ctx?.contextTokens,
  };
}

export function getAgentSessionCounts(): Record<
  string,
  { active: number; archived: number; total: number }
> {
  const agents = getAgents();
  const counts: Record<string, { active: number; archived: number; total: number }> = {};

  for (const agent of agents) {
    const sessions = getSessionsForAgent(agent.id);
    const active = sessions.filter((s) => s.status === "active").length;
    const archived = sessions.filter((s) => s.status !== "active").length;
    counts[agent.id] = { active, archived, total: sessions.length };
  }

  return counts;
}

export function getUsageData(): UsageRecord[] {
  const agents = getAgents();
  const records: UsageRecord[] = [];

  for (const agent of agents) {
    const sessionsDir = path.join(OPENCLAW_DIR, "agents", agent.id, "sessions");
    if (!fs.existsSync(sessionsDir)) continue;

    const files = fs.readdirSync(sessionsDir);
    for (const file of files) {
      const parsed = parseFilename(file);
      if (!parsed) continue;

      try {
        const content = fs.readFileSync(path.join(sessionsDir, file), "utf-8");
        const lines = content.trim().split("\n");
        for (const line of lines) {
          try {
            const obj = JSON.parse(line);
            if (obj.type !== "message") continue;
            const msg = obj.message;
            if (msg?.role !== "assistant" || !msg.usage) continue;

            const ts: number =
              typeof msg.timestamp === "number" ? msg.timestamp : new Date(obj.timestamp).getTime();

            records.push({
              timestamp: ts,
              sessionId: parsed.id,
              agentId: agent.id,
              agentName: agent.name,
              model: msg.model || "unknown",
              provider: msg.provider || "unknown",
              inputTokens: msg.usage.input || msg.usage.inputTokens || 0,
              outputTokens: msg.usage.output || msg.usage.outputTokens || 0,
              cachedTokens: msg.usage.cacheRead || 0,
              cost: msg.usage.cost?.total || 0,
            });
          } catch {
            /* skip malformed lines */
          }
        }
      } catch {
        /* skip unreadable files */
      }
    }
  }

  return records.sort((a, b) => a.timestamp - b.timestamp);
}

export function getCronJobs(): CronJob[] {
  const cronPath = path.join(OPENCLAW_DIR, "cron", "jobs.json");
  if (!fs.existsSync(cronPath)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(cronPath, "utf-8"));
    return data.jobs || [];
  } catch {
    return [];
  }
}

export function getCronRuns(): CronRun[] {
  const runsDir = path.join(OPENCLAW_DIR, "cron", "runs");
  if (!fs.existsSync(runsDir)) return [];

  const runs: CronRun[] = [];
  try {
    const files = fs.readdirSync(runsDir).filter((f) => f.endsWith(".jsonl"));
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(runsDir, file), "utf-8");
        for (const line of content.trim().split("\n")) {
          if (!line) continue;
          try {
            const obj = JSON.parse(line);
            if (obj.action === "finished") {
              runs.push({
                jobId: obj.jobId,
                status: obj.status ?? "unknown",
                summary: obj.summary,
                runAtMs: obj.runAtMs,
                durationMs: obj.durationMs,
                nextRunAtMs: obj.nextRunAtMs,
                finishedAtMs: obj.ts,
              });
            }
          } catch {
            /* skip malformed lines */
          }
        }
      } catch {
        /* skip unreadable files */
      }
    }
  } catch {
    return [];
  }

  return runs.sort((a, b) => b.finishedAtMs - a.finishedAtMs);
}

export function getGatewayInfo(): GatewayInfo {
  const configPath = path.join(OPENCLAW_DIR, "openclaw.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  const gw = config.gateway || {};
  const port = gw.port ?? 18789;
  const bind = gw.bind ?? "loopback";
  const host = bind === "loopback" ? "127.0.0.1" : "0.0.0.0";

  let pid: number | null = null;
  let startedAt: string | null = null;
  let healthMonitor: { interval: number; grace: number } | null = null;

  try {
    const logPath = path.join(OPENCLAW_DIR, "logs", "gateway.log");
    if (fs.existsSync(logPath)) {
      const content = fs.readFileSync(logPath, "utf-8");
      const lines = content.split("\n");
      let latestGatewayStartAt: string | null = null;
      let latestHeartbeatStartAt: string | null = null;

      for (const line of lines) {
        const ts = line.match(/^(\d{4}-\d{2}-\d{2}T[\d:.]+Z)/)?.[1] ?? null;

        if (line.includes("[heartbeat] started") && ts) {
          latestHeartbeatStartAt = ts;
        }

        if (line.includes("[gateway] listening on") && ts) {
          latestGatewayStartAt = ts;
          const pidMatch = line.match(/PID (\d+)/);
          if (pidMatch) pid = parseInt(pidMatch[1], 10);
        }

        const hmMatch = line.match(/health-monitor.*interval: (\d+)s, grace: (\d+)s/);
        if (hmMatch)
          healthMonitor = {
            interval: parseInt(hmMatch[1], 10),
            grace: parseInt(hmMatch[2], 10),
          };
      }

      startedAt = latestGatewayStartAt ?? latestHeartbeatStartAt;
    }
  } catch {
    /* ignore */
  }

  const cronJobs = getCronJobs();

  return {
    port,
    mode: gw.mode ?? "local",
    bind,
    wsUrl: `ws://${host}:${port}`,
    auth: { mode: gw.auth?.mode ?? "none", token: gw.auth?.token ?? "" },
    tailscale: {
      mode: gw.tailscale?.mode ?? "off",
      resetOnExit: gw.tailscale?.resetOnExit ?? false,
    },
    deniedCommands: gw.nodes?.denyCommands ?? [],
    version: config.meta?.lastTouchedVersion ?? "unknown",
    lastTouchedAt: config.meta?.lastTouchedAt ?? "",
    pid,
    startedAt,
    healthMonitor,
    cronEnabled: cronJobs.length > 0,
    cronJobCount: cronJobs.length,
  };
}

export function getPairedDevices(): PairedDevice[] {
  try {
    const devicesPath = path.join(OPENCLAW_DIR, "devices", "paired.json");
    if (!fs.existsSync(devicesPath)) return [];
    const data = JSON.parse(fs.readFileSync(devicesPath, "utf-8"));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Object.values(data).map((d: any) => {
      const tokens = d.tokens as Record<string, { lastUsedAtMs?: number }> | undefined;
      let lastUsedAtMs: number | null = null;
      if (tokens) {
        for (const t of Object.values(tokens)) {
          if (t.lastUsedAtMs && (!lastUsedAtMs || t.lastUsedAtMs > lastUsedAtMs)) {
            lastUsedAtMs = t.lastUsedAtMs;
          }
        }
      }
      return {
        deviceId: d.deviceId as string,
        platform: d.platform as string,
        clientId: d.clientId as string,
        clientMode: d.clientMode as string,
        role: d.role as string,
        scopes: (d.approvedScopes ?? d.scopes ?? []) as string[],
        createdAtMs: d.createdAtMs as number,
        approvedAtMs: d.approvedAtMs as number,
        lastUsedAtMs,
      };
    });
  } catch {
    return [];
  }
}

export function getActiveSessions(): (SessionSummary & {
  agentName: string;
})[] {
  const agents = getAgents();
  const active: (SessionSummary & { agentName: string })[] = [];
  for (const agent of agents) {
    const sessions = getSessionsForAgent(agent.id);
    for (const s of sessions) {
      if (s.status === "active") {
        active.push({ ...s, agentName: agent.name });
      }
    }
  }
  return active.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());
}

const CORE_FILE_NAMES = [
  "AGENTS.md",
  "IDENTITY.md",
  "HEARTBEAT.md",
  "TOOLS.md",
  "SOUL.md",
  "USER.md",
  "MEMORY.md",
] as const;

export type CoreFile = { name: string; content: string | null };

export function getCoreFilesForAgent(workspace: string | undefined): CoreFile[] {
  if (!workspace) return CORE_FILE_NAMES.map((name) => ({ name, content: null }));

  return CORE_FILE_NAMES.map((name) => {
    const filePath = path.join(workspace, name);
    try {
      if (fs.existsSync(filePath)) {
        return { name, content: fs.readFileSync(filePath, "utf-8") };
      }
    } catch {
      /* ignore */
    }
    return { name, content: null };
  });
}

export function getAllSessions(): (SessionSummary & { agentName: string })[] {
  const agents = getAgents();
  const all: (SessionSummary & { agentName: string })[] = [];
  for (const agent of agents) {
    const sessions = getSessionsForAgent(agent.id);
    for (const s of sessions) {
      all.push({ ...s, agentName: agent.name });
    }
  }
  return all.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());
}

function parseHeartbeatInterval(value: unknown): { every: string; everyMs: number | null } {
  if (value === false || value === "disabled" || value === "off") {
    return { every: "disabled", everyMs: null };
  }
  if (typeof value === "number") {
    return { every: `${value}ms`, everyMs: value };
  }
  if (typeof value === "string") {
    const match = value.match(/^(\d+)(ms|s|m|h)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      const unit = match[2];
      const multipliers: Record<string, number> = { ms: 1, s: 1000, m: 60000, h: 3600000 };
      return { every: value, everyMs: n * (multipliers[unit] || 1) };
    }
    return { every: value, everyMs: null };
  }
  return { every: "disabled", everyMs: null };
}

function getHeartbeatLogEvents(): HeartbeatLogEntry[] {
  const entries: HeartbeatLogEntry[] = [];
  const logsDir = "/tmp/openclaw";

  try {
    if (!fs.existsSync(logsDir)) return entries;
    const files = fs
      .readdirSync(logsDir)
      .filter((f) => f.endsWith(".log"))
      .sort()
      .reverse();

    for (const file of files.slice(0, 3)) {
      try {
        const content = fs.readFileSync(path.join(logsDir, file), "utf-8");
        for (const line of content.split("\n")) {
          if (!line.includes("heartbeat")) continue;
          try {
            const obj = JSON.parse(line);
            const subsystem = typeof obj["0"] === "string" ? obj["0"] : "";
            if (!subsystem.includes("gateway/heartbeat")) continue;
            const meta = obj["1"];
            entries.push({
              timestamp: obj.time || obj._meta?.date || "",
              intervalMs: meta?.intervalMs ?? 0,
              agentId: meta?.agentId,
            });
          } catch {
            /* skip */
          }
        }
      } catch {
        /* skip */
      }
    }
  } catch {
    /* ignore */
  }

  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getHeartbeatStatus(): HeartbeatStatus {
  const configPath = path.join(OPENCLAW_DIR, "openclaw.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  const agents = getAgents();

  const defaults = config.agents?.defaults || {};
  const defaultHeartbeat = defaults.heartbeat || {};
  const defaultEvery = defaultHeartbeat.every ?? "30m";

  const defaultAgent = agents.find((a) => a.default) || agents[0];
  const defaultAgentId = defaultAgent?.id || "main";

  const heartbeatAgents = agents.map((agent) => {
    const agentConfig = (config.agents?.list || []).find(
      (a: Record<string, unknown>) => a.id === agent.id,
    );
    const agentHb = agentConfig?.heartbeat;

    let enabled: boolean;
    let interval: { every: string; everyMs: number | null };

    if (agentHb !== undefined) {
      if (agentHb === false || agentHb?.enabled === false) {
        enabled = false;
        interval = { every: "disabled", everyMs: null };
      } else {
        enabled = true;
        interval = parseHeartbeatInterval(agentHb?.every ?? agentHb);
      }
    } else if (agent.default) {
      enabled = defaultEvery !== "disabled" && defaultEvery !== false;
      interval = parseHeartbeatInterval(defaultEvery);
    } else {
      enabled = false;
      interval = { every: "disabled", everyMs: null };
    }

    return {
      agentId: agent.id,
      agentName: agent.name,
      enabled,
      ...interval,
    };
  });

  const sessions = agents.map((agent) => {
    const sessionsPath = path.join(OPENCLAW_DIR, "agents", agent.id, "sessions", "sessions.json");
    let sessionCount = 0;
    let activeCount = 0;
    let totalTokens = 0;
    let contextTokens = 0;
    let model: string | null = null;
    let lastActivity: string | null = null;

    try {
      if (fs.existsSync(sessionsPath)) {
        const data = JSON.parse(fs.readFileSync(sessionsPath, "utf-8"));
        const entries = Object.values(data) as Record<string, unknown>[];
        sessionCount = entries.length;

        for (const entry of entries) {
          const updatedAt = entry.updatedAt as number | undefined;
          if (updatedAt) {
            activeCount++;
            const ts = new Date(updatedAt).toISOString();
            if (!lastActivity || ts > lastActivity) lastActivity = ts;
          }
          totalTokens += (entry.totalTokens as number) || 0;
          contextTokens = Math.max(contextTokens, (entry.contextTokens as number) || 0);
          if (entry.model) model = entry.model as string;
        }
      }
    } catch {
      /* ignore */
    }

    return {
      agentId: agent.id,
      agentName: agent.name,
      sessionCount,
      activeSessionCount: activeCount,
      lastActivity,
      totalTokens,
      contextTokens,
      percentUsed: contextTokens > 0 ? Math.round((totalTokens / contextTokens) * 100) : 0,
      model,
    };
  });

  const heartbeatFilePaths = agents.map((agent) => {
    const workspace = agent.workspace;
    const hbPath = workspace ? path.join(workspace, "HEARTBEAT.md") : null;
    return {
      agentId: agent.id,
      path: hbPath || "(no workspace)",
      exists: hbPath ? fs.existsSync(hbPath) : false,
    };
  });

  const recentEvents = getHeartbeatLogEvents().slice(0, 20);
  const lastHeartbeatAt = recentEvents.length > 0 ? recentEvents[0].timestamp : null;

  let gatewayRunning = false;
  try {
    const logPath = path.join(OPENCLAW_DIR, "logs", "gateway.log");
    if (fs.existsSync(logPath)) {
      const stat = fs.statSync(logPath);
      gatewayRunning = Date.now() - stat.mtime.getTime() < 60_000;
    }
  } catch {
    /* ignore */
  }

  return {
    defaultAgentId,
    agents: heartbeatAgents,
    sessions,
    recentHeartbeatEvents: recentEvents,
    heartbeatFilePaths,
    lastHeartbeatAt,
    gatewayRunning,
  };
}

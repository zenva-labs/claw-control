import fs from "fs";
import os from "os";
import path from "path";
import type {
  AgentConfig,
  CronJob,
  CronRun,
  GatewayInfo,
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
  try {
    const sessionsPath = path.join(OPENCLAW_DIR, "agents", agentId, "sessions", "sessions.json");
    if (!fs.existsSync(sessionsPath)) return [];
    const data = JSON.parse(fs.readFileSync(sessionsPath, "utf-8"));

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

    return (latest?.skillsSnapshot?.resolvedSkills ?? []).map((s: ResolvedSkill) => ({
      name: s.name,
      description: s.description,
      source: s.source,
      filePath: s.filePath,
      disableModelInvocation: s.disableModelInvocation ?? false,
    }));
  } catch {
    return [];
  }
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

  return { id: sessionId_, status, startedAt, model, provider, messages };
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
      for (const line of lines) {
        if (!startedAt) {
          const ts = line.match(/^(\d{4}-\d{2}-\d{2}T[\d:.]+Z)/);
          if (ts) startedAt = ts[1];
        }
        const pidMatch = line.match(/PID (\d+)/);
        if (pidMatch) pid = parseInt(pidMatch[1], 10);
        const hmMatch = line.match(/health-monitor.*interval: (\d+)s, grace: (\d+)s/);
        if (hmMatch)
          healthMonitor = {
            interval: parseInt(hmMatch[1], 10),
            grace: parseInt(hmMatch[2], 10),
          };
      }
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

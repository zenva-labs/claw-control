export interface AgentConfig {
  id: string;
  name: string;
  model: string;
  workspace?: string;
  default?: boolean;
  subagents?: {
    allowAgents?: string[];
  };
}

export interface SessionSummary {
  id: string;
  agentId: string;
  status: "active" | "reset" | "deleted";
  filename: string;
  archivedAt?: string;
  startedAt?: string;
  modifiedAt: string;
  messageCount: number;
  totalCost: number;
  lastUserMessage?: string;
}

export interface ContentBlock {
  type: "text" | "thinking" | "toolCall" | "toolResult";
  text?: string;
  thinking?: string;
  toolCallId?: string;
  toolName?: string;
  toolArguments?: Record<string, unknown>;
  toolResultContent?: string;
  isError?: boolean;
}

export interface SessionMessage {
  id: string;
  role: "user" | "assistant" | "toolResult";
  timestamp: number;
  content: ContentBlock[];
  model?: string;
  provider?: string;
  usage?: {
    input: number;
    output: number;
    cacheRead: number;
    cost?: number;
  };
  toolCallId?: string;
  toolName?: string;
}

export interface ParsedSession {
  id: string;
  status: "active" | "reset" | "deleted";
  startedAt: string;
  model?: string;
  provider?: string;
  messages: SessionMessage[];
}

export interface CronSchedule {
  kind: string;
  at?: string;
  cron?: string;
}

export interface CronPayload {
  kind: string;
  text?: string;
  [key: string]: unknown;
}

export interface CronJobState {
  nextRunAtMs?: number;
  lastRunAtMs?: number;
  lastRunStatus?: string;
  [key: string]: unknown;
}

export interface CronJob {
  id: string;
  name: string;
  enabled: boolean;
  deleteAfterRun?: boolean;
  createdAtMs: number;
  updatedAtMs: number;
  schedule: CronSchedule;
  sessionTarget: string;
  wakeMode?: string;
  payload: CronPayload;
  state?: CronJobState;
}

export interface ResolvedSkill {
  name: string;
  description: string;
  source: string;
  filePath?: string;
  disableModelInvocation?: boolean;
}

export interface ResolvedTool {
  name: string;
  description: string;
  category: string;
  propertiesCount: number;
}

export interface CronRun {
  jobId: string;
  status: string;
  summary?: string;
  runAtMs: number;
  durationMs: number;
  nextRunAtMs?: number;
  finishedAtMs: number;
}

export interface GatewayInfo {
  port: number;
  mode: string;
  bind: string;
  wsUrl: string;
  auth: { mode: string; token: string };
  tailscale: { mode: string; resetOnExit: boolean };
  deniedCommands: string[];
  version: string;
  lastTouchedAt: string;
  pid: number | null;
  startedAt: string | null;
  healthMonitor: { interval: number; grace: number } | null;
  cronEnabled: boolean;
  cronJobCount: number;
}

export interface PairedDevice {
  deviceId: string;
  platform: string;
  clientId: string;
  clientMode: string;
  role: string;
  scopes: string[];
  createdAtMs: number;
  approvedAtMs: number;
  lastUsedAtMs: number | null;
}

export interface UsageRecord {
  timestamp: number;
  sessionId: string;
  agentId: string;
  agentName: string;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  cost: number;
}

import type {
  AgentConfig,
  ChannelsStatus,
  CronJob,
  CronRun,
  GatewayInfo,
  HeartbeatStatus,
  PairedDevice,
  ParsedSession,
  ResolvedSkill,
  ResolvedTool,
  SessionSummary,
  UsageRecord,
} from "@/lib/types";

export type CoreFile = {
  name: string;
  content: string | null;
};

export type LogEntry = {
  time: string;
  level: string;
  component: string;
  message: string;
};

export type SessionCounts = {
  active: number;
  archived: number;
  total: number;
};

export interface DataProvider {
  getAgents(): AgentConfig[];
  getSkillsForAgent(agentId: string): ResolvedSkill[];
  getToolsForAgent(agentId: string): ResolvedTool[];
  getSessionsForAgent(agentId: string): SessionSummary[];
  getSession(agentId: string, sessionId: string): ParsedSession | null;
  getAgentSessionCounts(): Record<string, SessionCounts>;
  getUsageData(): UsageRecord[];
  getCronJobs(): CronJob[];
  getCronRuns(): CronRun[];
  getGatewayInfo(): GatewayInfo;
  getPairedDevices(): PairedDevice[];
  getChannelsStatus(): ChannelsStatus;
  getActiveSessions(): (SessionSummary & { agentName: string })[];
  getCoreFilesForAgent(workspace: string | undefined): CoreFile[];
  getAllSessions(): (SessionSummary & { agentName: string })[];
  getHeartbeatStatus(): HeartbeatStatus;
  getDemoLogEntries(): LogEntry[];
  getDemoLogSourceLabel(): string;
}

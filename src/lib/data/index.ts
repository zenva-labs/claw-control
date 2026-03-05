import { isDemoMode } from "@/lib/demo/mode";
import { demoProvider } from "@/lib/data/demo-provider";
import { openclawProvider } from "@/lib/data/openclaw-provider";
import type { DataProvider } from "@/lib/data/provider";

const provider: DataProvider = isDemoMode() ? demoProvider : openclawProvider;

export const getAgents = () => provider.getAgents();
export const getSkillsForAgent = (agentId: string) => provider.getSkillsForAgent(agentId);
export const getToolsForAgent = (agentId: string) => provider.getToolsForAgent(agentId);
export const getSessionsForAgent = (agentId: string) => provider.getSessionsForAgent(agentId);
export const getSession = (agentId: string, sessionId: string) =>
  provider.getSession(agentId, sessionId);
export const getAgentSessionCounts = () => provider.getAgentSessionCounts();
export const getUsageData = () => provider.getUsageData();
export const getCronJobs = () => provider.getCronJobs();
export const getCronRuns = () => provider.getCronRuns();
export const getGatewayInfo = () => provider.getGatewayInfo();
export const getPairedDevices = () => provider.getPairedDevices();
export const getChannelsStatus = () => provider.getChannelsStatus();
export const getActiveSessions = () => provider.getActiveSessions();
export const getCoreFilesForAgent = (workspace: string | undefined) =>
  provider.getCoreFilesForAgent(workspace);
export const getAllSessions = () => provider.getAllSessions();
export const getHeartbeatStatus = () => provider.getHeartbeatStatus();
export const getDemoLogEntries = () => provider.getDemoLogEntries();
export const getDemoLogSourceLabel = () => provider.getDemoLogSourceLabel();

export type { CoreFile, DataProvider, LogEntry, SessionCounts } from "@/lib/data/provider";

import type {
  AgentConfig,
  ChannelsStatus,
  ContentBlock,
  CronJob,
  CronRun,
  GatewayInfo,
  HeartbeatLogEntry,
  HeartbeatStatus,
  PairedDevice,
  ParsedSession,
  ResolvedSkill,
  ResolvedTool,
  SessionMessage,
  SessionSummary,
  UsageRecord,
} from "@/lib/types";
import type { CoreFile, DataProvider, LogEntry, SessionCounts } from "@/lib/data/provider";

const NOW = Date.now();
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const OPENCLAW_DIR = "/Users/demo/.openclaw";
const DEMO_LOG_SOURCE_LABEL = `${OPENCLAW_DIR}/logs/openclaw-demo.log`;

function isoAgo(msAgo: number): string {
  return new Date(NOW - msAgo).toISOString();
}

function tsAgo(msAgo: number): number {
  return NOW - msAgo;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

const AGENTS: AgentConfig[] = [
  {
    id: "research-scount",
    name: "Research Scount",
    model: "claude-3-7-sonnet",
    workspace: "/Users/demo/workspaces/research-scount",
  },
  {
    id: "marketing-lead",
    name: "Marketing Lead",
    model: "gpt-5",
    workspace: "/Users/demo/workspaces/marketing-lead",
  },
  {
    id: "content-manager",
    name: "Content Manager",
    model: "gpt-4.1-mini",
    workspace: "/Users/demo/workspaces/content-manager",
  },
  {
    id: "personal-assistant",
    name: "Personal Assistant",
    model: "gpt-5",
    workspace: "/Users/demo/workspaces/personal-assistant",
    default: true,
    subagents: {
      allowAgents: ["research-scount", "marketing-lead", "content-manager", "customer-support"],
    },
  },
  {
    id: "customer-support",
    name: "Customer Support",
    model: "gpt-4.1",
    workspace: "/Users/demo/workspaces/customer-support",
  },
];

const AGENT_NAME_BY_ID = Object.fromEntries(AGENTS.map((agent) => [agent.id, agent.name]));

const SESSION_SUMMARIES_BY_AGENT: Record<string, SessionSummary[]> = {
  "research-scount": [
    {
      id: "rs-market-trends-2026",
      agentId: "research-scount",
      status: "active",
      filename: "rs-market-trends-2026.jsonl",
      startedAt: isoAgo(9 * HOUR),
      modifiedAt: isoAgo(11 * MINUTE),
      messageCount: 44,
      totalCost: 132.4812,
      lastUserMessage: "Expand this into a 2-page strategic narrative with regional variance.",
      totalTokens: 320_400,
      contextTokens: 400_000,
    },
    {
      id: "rs-competitor-map-q1",
      agentId: "research-scount",
      status: "reset",
      filename: "rs-competitor-map-q1.jsonl.reset.2026-03-01T06-11-12Z",
      archivedAt: "2026-03-01T06:11:12.000Z",
      startedAt: isoAgo(6 * DAY),
      modifiedAt: isoAgo(4 * DAY),
      messageCount: 31,
      totalCost: 87.2513,
      lastUserMessage: "Reset this and continue under the annual planning thread.",
      totalTokens: 246_120,
      contextTokens: 400_000,
    },
  ],
  "marketing-lead": [
    {
      id: "ml-launch-plan-spring",
      agentId: "marketing-lead",
      status: "active",
      filename: "ml-launch-plan-spring.jsonl",
      startedAt: isoAgo(7 * HOUR),
      modifiedAt: isoAgo(18 * MINUTE),
      messageCount: 39,
      totalCost: 118.3321,
      lastUserMessage: "Turn this launch plan into a board-ready narrative with risk scenarios.",
      totalTokens: 289_902,
      contextTokens: 350_000,
    },
    {
      id: "ml-campaign-postmortem",
      agentId: "marketing-lead",
      status: "deleted",
      filename: "ml-campaign-postmortem.jsonl.deleted.2026-02-24T17-29-00Z",
      archivedAt: "2026-02-24T17:29:00.000Z",
      startedAt: isoAgo(10 * DAY),
      modifiedAt: isoAgo(9 * DAY),
      messageCount: 27,
      totalCost: 64.1299,
      lastUserMessage: "Archive after extracting lessons and owner follow-ups.",
      totalTokens: 182_240,
      contextTokens: 350_000,
    },
  ],
  "content-manager": [
    {
      id: "cm-content-calendar-apr",
      agentId: "content-manager",
      status: "active",
      filename: "cm-content-calendar-apr.jsonl",
      startedAt: isoAgo(13 * HOUR),
      modifiedAt: isoAgo(22 * MINUTE),
      messageCount: 36,
      totalCost: 91.2287,
      lastUserMessage: "Add channel-specific CTAs and repurposing notes per piece.",
      totalTokens: 214_335,
      contextTokens: 300_000,
    },
    {
      id: "cm-seo-refresh",
      agentId: "content-manager",
      status: "reset",
      filename: "cm-seo-refresh.jsonl.reset.2026-02-27T09-20-31Z",
      archivedAt: "2026-02-27T09:20:31.000Z",
      startedAt: isoAgo(7 * DAY),
      modifiedAt: isoAgo(6 * DAY),
      messageCount: 29,
      totalCost: 73.7731,
      lastUserMessage: "Reset and split this into pillar page and supporting cluster tasks.",
      totalTokens: 198_002,
      contextTokens: 300_000,
    },
  ],
  "personal-assistant": [
    {
      id: "pa-exec-briefing",
      agentId: "personal-assistant",
      status: "active",
      filename: "pa-exec-briefing.jsonl",
      startedAt: isoAgo(5 * HOUR),
      modifiedAt: isoAgo(5 * MINUTE),
      messageCount: 52,
      totalCost: 156.4408,
      lastUserMessage: "Refine this into a 10-minute verbal briefing with fallback talking points.",
      totalTokens: 348_550,
      contextTokens: 450_000,
    },
    {
      id: "pa-travel-and-schedule",
      agentId: "personal-assistant",
      status: "active",
      filename: "pa-travel-and-schedule.jsonl",
      startedAt: isoAgo(28 * HOUR),
      modifiedAt: isoAgo(33 * MINUTE),
      messageCount: 41,
      totalCost: 109.9902,
      lastUserMessage: "Merge all travel constraints with prep tasks into one timeline.",
      totalTokens: 271_740,
      contextTokens: 450_000,
    },
  ],
  "customer-support": [
    {
      id: "cs-escalation-digest",
      agentId: "customer-support",
      status: "active",
      filename: "cs-escalation-digest.jsonl",
      startedAt: isoAgo(11 * HOUR),
      modifiedAt: isoAgo(9 * MINUTE),
      messageCount: 48,
      totalCost: 143.1172,
      lastUserMessage: "Create a customer-safe summary for all P1/P2 escalations.",
      totalTokens: 305_221,
      contextTokens: 380_000,
    },
    {
      id: "cs-deflection-playbook",
      agentId: "customer-support",
      status: "deleted",
      filename: "cs-deflection-playbook.jsonl.deleted.2026-02-25T22-40-12Z",
      archivedAt: "2026-02-25T22:40:12.000Z",
      startedAt: isoAgo(8 * DAY),
      modifiedAt: isoAgo(7 * DAY),
      messageCount: 33,
      totalCost: 96.3005,
      lastUserMessage: "Archive this iteration and keep the v3 playbook only.",
      totalTokens: 220_100,
      contextTokens: 380_000,
    },
  ],
};

function userMessage(id: string, timestamp: number, text: string): SessionMessage {
  return {
    id,
    role: "user",
    timestamp,
    content: [{ type: "text", text }],
  };
}

function assistantMessage(
  id: string,
  timestamp: number,
  text: string,
  model: string,
  provider: string,
  usage: SessionMessage["usage"],
  extraBlocks: ContentBlock[] = [],
): SessionMessage {
  return {
    id,
    role: "assistant",
    timestamp,
    model,
    provider,
    usage,
    content: [{ type: "text", text }, ...extraBlocks],
  };
}

function toolResultMessage(
  id: string,
  timestamp: number,
  toolCallId: string,
  toolName: string,
  toolResultContent: string,
): SessionMessage {
  return {
    id,
    role: "toolResult",
    timestamp,
    toolCallId,
    toolName,
    content: [
      {
        type: "toolResult",
        toolCallId,
        toolName,
        toolResultContent,
      },
    ],
  };
}

const SESSION_DETAILS_BY_AGENT: Record<string, Record<string, ParsedSession>> = {
  "research-scount": {
    "rs-market-trends-2026": {
      id: "rs-market-trends-2026",
      status: "active",
      startedAt: isoAgo(9 * HOUR),
      model: "claude-3-7-sonnet",
      provider: "anthropic",
      totalTokens: 320_400,
      contextTokens: 400_000,
      messages: [
        userMessage(
          "rs-1",
          tsAgo(8 * HOUR + 40 * MINUTE),
          "Create a strategic market outlook covering enterprise automation, regional adoption variance, and buyer sentiment shifts through Q4.",
        ),
        assistantMessage(
          "rs-2",
          tsAgo(8 * HOUR + 36 * MINUTE),
          "I drafted a detailed outline with segment assumptions, risk conditions, and scenario ranges. The narrative spans North America, EMEA, and APAC with demand elasticity notes for each vertical.",
          "claude-3-7-sonnet",
          "anthropic",
          { input: 18_300, output: 6_540, cacheRead: 0, cost: 18.64 },
        ),
        userMessage(
          "rs-3",
          tsAgo(6 * HOUR + 10 * MINUTE),
          "Expand the regional section and add an explicit list of leading indicators that would force a revision.",
        ),
        assistantMessage(
          "rs-4",
          tsAgo(6 * HOUR + 2 * MINUTE),
          "Expanded. Each region now has its own indicator table: pipeline velocity, procurement cycle compression, partner channel conversion, and renewal confidence. I also added trigger thresholds for revising the forecast.",
          "gpt-5",
          "openai",
          { input: 21_220, output: 7_010, cacheRead: 1_880, cost: 22.41 },
        ),
        userMessage(
          "rs-5",
          tsAgo(2 * HOUR + 20 * MINUTE),
          "Turn this into an executive two-page narrative with footnotes and clear calls to action.",
        ),
        assistantMessage(
          "rs-6",
          tsAgo(2 * HOUR + 8 * MINUTE),
          "Completed. The brief now has an executive narrative, three high-conviction bets, two downside scenarios, and a footnoted evidence appendix. Calls to action are sequenced by impact and reversibility.",
          "gemini-2.5-pro",
          "google",
          { input: 24_900, output: 8_200, cacheRead: 1_240, cost: 27.95 },
        ),
      ],
    },
    "rs-competitor-map-q1": {
      id: "rs-competitor-map-q1",
      status: "reset",
      startedAt: isoAgo(6 * DAY),
      model: "gpt-5",
      provider: "openai",
      totalTokens: 246_120,
      contextTokens: 400_000,
      messages: [
        userMessage(
          "rsq1-1",
          tsAgo(6 * DAY - 40 * MINUTE),
          "Build a full competitor map for Q1 with category, pricing, and bundling deltas.",
        ),
        assistantMessage(
          "rsq1-2",
          tsAgo(6 * DAY - 35 * MINUTE),
          "I assembled a full map and highlighted pricing compression pockets where challengers undercut bundles by 12-18 percent.",
          "gpt-5",
          "openai",
          { input: 15_100, output: 5_100, cacheRead: 1_020, cost: 15.31 },
        ),
      ],
    },
  },
  "marketing-lead": {
    "ml-launch-plan-spring": {
      id: "ml-launch-plan-spring",
      status: "active",
      startedAt: isoAgo(7 * HOUR),
      model: "gpt-5",
      provider: "openai",
      totalTokens: 289_902,
      contextTokens: 350_000,
      messages: [
        userMessage(
          "ml-1",
          tsAgo(6 * HOUR + 22 * MINUTE),
          "Draft a launch plan that coordinates PR, lifecycle, paid, and partner channels with week-by-week deliverables.",
        ),
        assistantMessage(
          "ml-2",
          tsAgo(6 * HOUR + 15 * MINUTE),
          "I built a 6-week plan with dependencies, fallback routes, and owner assignments. Week 3 now acts as a decision gate to prevent budget lock-in before activation quality is validated.",
          "gpt-5",
          "openai",
          { input: 19_880, output: 6_090, cacheRead: 2_004, cost: 19.87 },
        ),
        userMessage(
          "ml-3",
          tsAgo(4 * HOUR + 50 * MINUTE),
          "Add risk scenarios for low CTR and delayed analyst coverage; include mitigation plays.",
        ),
        assistantMessage(
          "ml-4",
          tsAgo(4 * HOUR + 41 * MINUTE),
          "Added three scenarios with clear thresholds and pre-approved mitigation plays. The plan now includes messaging pivot templates, budget reallocation triggers, and revised attribution windows.",
          "claude-3-5-sonnet",
          "anthropic",
          { input: 17_430, output: 5_810, cacheRead: 0, cost: 17.29 },
        ),
        userMessage(
          "ml-5",
          tsAgo(95 * MINUTE),
          "Convert this into a concise board narrative with top-line KPI commitments.",
        ),
        assistantMessage(
          "ml-6",
          tsAgo(82 * MINUTE),
          "Board narrative completed: I condensed the plan into strategic rationale, KPI commitments, downside protections, and explicit checkpoints. Each KPI is mapped to a named owner and instrumentation source.",
          "gpt-4.1",
          "openai",
          { input: 22_700, output: 7_150, cacheRead: 1_120, cost: 24.02 },
        ),
      ],
    },
    "ml-campaign-postmortem": {
      id: "ml-campaign-postmortem",
      status: "deleted",
      startedAt: isoAgo(10 * DAY),
      model: "gpt-4.1",
      provider: "openai",
      totalTokens: 182_240,
      contextTokens: 350_000,
      messages: [
        userMessage(
          "mlpm-1",
          tsAgo(10 * DAY - 22 * MINUTE),
          "Summarize campaign underperformance and isolate avoidable failure points.",
        ),
        assistantMessage(
          "mlpm-2",
          tsAgo(10 * DAY - 14 * MINUTE),
          "Identified avoidable points across targeting drift, creative latency, and delayed budget pacing corrections. Included owner-level remediation actions.",
          "gpt-4.1",
          "openai",
          { input: 12_840, output: 4_880, cacheRead: 880, cost: 12.73 },
        ),
      ],
    },
  },
  "content-manager": {
    "cm-content-calendar-apr": {
      id: "cm-content-calendar-apr",
      status: "active",
      startedAt: isoAgo(13 * HOUR),
      model: "gpt-4.1-mini",
      provider: "openai",
      totalTokens: 214_335,
      contextTokens: 300_000,
      messages: [
        userMessage(
          "cm-1",
          tsAgo(12 * HOUR + 15 * MINUTE),
          "Create a full April content calendar with primary narrative arcs, launch tie-ins, and SEO intent mapping.",
        ),
        assistantMessage(
          "cm-2",
          tsAgo(12 * HOUR + 8 * MINUTE),
          "Drafted a 4-week calendar with thematic arcs, production timing, and SEO intent by funnel stage. Every asset now includes target distribution channels and conversion objective.",
          "gpt-4.1-mini",
          "openai",
          { input: 14_120, output: 5_340, cacheRead: 1_210, cost: 10.55 },
        ),
        userMessage(
          "cm-3",
          tsAgo(10 * HOUR + 40 * MINUTE),
          "Add repurposing guidance for social clips, newsletter modules, and sales enablement snippets.",
        ),
        assistantMessage(
          "cm-4",
          tsAgo(10 * HOUR + 33 * MINUTE),
          "Added repurposing plans for each content asset, including clip variants, newsletter block strategy, and sales collateral extraction notes.",
          "gpt-5",
          "openai",
          { input: 16_540, output: 6_200, cacheRead: 1_480, cost: 18.07 },
        ),
        userMessage(
          "cm-5",
          tsAgo(2 * HOUR + 5 * MINUTE),
          "Give me a finalized editorial schedule with dependency risk notes.",
        ),
        assistantMessage(
          "cm-6",
          tsAgo(110 * MINUTE),
          "Final schedule delivered with explicit dependency risks, cut lines for optional assets, and a contingency sequence for delayed design inputs.",
          "gemini-2.0-flash",
          "google",
          { input: 11_900, output: 4_320, cacheRead: 0, cost: 9.78 },
        ),
      ],
    },
    "cm-seo-refresh": {
      id: "cm-seo-refresh",
      status: "reset",
      startedAt: isoAgo(7 * DAY),
      model: "gpt-5",
      provider: "openai",
      totalTokens: 198_002,
      contextTokens: 300_000,
      messages: [
        userMessage(
          "cmseo-1",
          tsAgo(7 * DAY - 20 * MINUTE),
          "Refresh these legacy articles and align intent clusters with new product taxonomy.",
        ),
        assistantMessage(
          "cmseo-2",
          tsAgo(7 * DAY - 11 * MINUTE),
          "Completed a full refresh map with canonical recommendations, internal link upgrades, and intent-cluster reassignment.",
          "gpt-5",
          "openai",
          { input: 13_600, output: 4_760, cacheRead: 970, cost: 13.42 },
        ),
      ],
    },
  },
  "personal-assistant": {
    "pa-exec-briefing": {
      id: "pa-exec-briefing",
      status: "active",
      startedAt: isoAgo(5 * HOUR),
      model: "gpt-5",
      provider: "openai",
      totalTokens: 348_550,
      contextTokens: 450_000,
      messages: [
        userMessage(
          "pa-1",
          tsAgo(4 * HOUR + 44 * MINUTE),
          "Prepare a 10-minute executive briefing that covers product velocity, customer risk, and board-facing narrative cohesion.",
        ),
        assistantMessage(
          "pa-2",
          tsAgo(4 * HOUR + 37 * MINUTE),
          "Initial draft prepared with opening narrative, KPI spine, and scenario framing. I kept each section short enough to deliver verbally without slides while preserving precision.",
          "gpt-5",
          "openai",
          { input: 22_940, output: 7_900, cacheRead: 1_990, cost: 24.34 },
          [
            {
              type: "thinking",
              thinking:
                "Need a tighter transition between customer risk and operating plan so it reads as one story rather than two parallel updates.",
            },
            {
              type: "toolCall",
              toolCallId: "call_exec_1",
              toolName: "edit",
              toolArguments: {
                file: "briefings/q2-exec.md",
                objective: "tighten narrative transitions and fallback talking points",
              },
            },
          ],
        ),
        toolResultMessage(
          "pa-3",
          tsAgo(4 * HOUR + 35 * MINUTE),
          "call_exec_1",
          "edit",
          "Patched q2-exec.md with revised transitions, contingency phrasing, and a one-page appendix.",
        ),
        userMessage(
          "pa-4",
          tsAgo(3 * HOUR + 28 * MINUTE),
          "Add a fallback script in case we get challenged on profitability timing.",
        ),
        assistantMessage(
          "pa-5",
          tsAgo(3 * HOUR + 20 * MINUTE),
          "Added a fallback script with two variants: conservative and confidence-forward. Both variants preserve strategic intent while acknowledging timing uncertainty explicitly.",
          "o3",
          "openai",
          { input: 18_710, output: 6_040, cacheRead: 1_430, cost: 20.62 },
        ),
        userMessage(
          "pa-6",
          tsAgo(54 * MINUTE),
          "Rehearse this for verbal delivery and tighten sentence length where needed.",
        ),
        assistantMessage(
          "pa-7",
          tsAgo(42 * MINUTE),
          "Done. I shortened sentence cadence, reduced subordinate clauses, and marked breathing points for verbal emphasis. The briefing now lands within a 9-11 minute window.",
          "claude-3-7-sonnet",
          "anthropic",
          { input: 19_320, output: 6_890, cacheRead: 0, cost: 21.11 },
        ),
      ],
    },
    "pa-travel-and-schedule": {
      id: "pa-travel-and-schedule",
      status: "active",
      startedAt: isoAgo(28 * HOUR),
      model: "o3",
      provider: "openai",
      totalTokens: 271_740,
      contextTokens: 450_000,
      messages: [
        userMessage(
          "pat-1",
          tsAgo(27 * HOUR + 20 * MINUTE),
          "Merge all travel legs, prep sessions, and stakeholder meetings into a single timeline with buffers.",
        ),
        assistantMessage(
          "pat-2",
          tsAgo(27 * HOUR + 11 * MINUTE),
          "Merged timeline delivered with hard constraints, optional buffers, and conflict windows called out by priority.",
          "o3",
          "openai",
          { input: 16_430, output: 5_840, cacheRead: 950, cost: 16.22 },
        ),
        userMessage(
          "pat-3",
          tsAgo(25 * HOUR + 50 * MINUTE),
          "Add alternate routing if either morning flight is delayed by over 45 minutes.",
        ),
        assistantMessage(
          "pat-4",
          tsAgo(25 * HOUR + 42 * MINUTE),
          "Added alternate routing tree with delay triggers, decision checkpoints, and stakeholder notification templates.",
          "gpt-5",
          "openai",
          { input: 15_200, output: 5_110, cacheRead: 1_060, cost: 15.77 },
        ),
      ],
    },
  },
  "customer-support": {
    "cs-escalation-digest": {
      id: "cs-escalation-digest",
      status: "active",
      startedAt: isoAgo(11 * HOUR),
      model: "gpt-4.1",
      provider: "openai",
      totalTokens: 305_221,
      contextTokens: 380_000,
      messages: [
        userMessage(
          "cs-1",
          tsAgo(10 * HOUR + 30 * MINUTE),
          "Draft a customer-safe digest for all open P1/P2 escalations with timelines, ownership, and current mitigation status.",
        ),
        assistantMessage(
          "cs-2",
          tsAgo(10 * HOUR + 21 * MINUTE),
          "Digest drafted with incident-safe language, owner accountability, and status certainty labels to prevent overstatement.",
          "gpt-4.1",
          "openai",
          { input: 20_220, output: 7_480, cacheRead: 1_420, cost: 21.56 },
        ),
        userMessage(
          "cs-3",
          tsAgo(8 * HOUR + 35 * MINUTE),
          "Add estimated next update windows and escalation routes for executive-sensitive accounts.",
        ),
        assistantMessage(
          "cs-4",
          tsAgo(8 * HOUR + 27 * MINUTE),
          "Added update windows with confidence bands and explicit escalation routes for executive-sensitive accounts.",
          "claude-3-5-haiku",
          "anthropic",
          { input: 13_500, output: 4_930, cacheRead: 0, cost: 10.64 },
        ),
        userMessage(
          "cs-5",
          tsAgo(85 * MINUTE),
          "Finalize this for outbound send and include one-line follow-up asks.",
        ),
        assistantMessage(
          "cs-6",
          tsAgo(73 * MINUTE),
          "Finalized with outbound-ready phrasing, one-line follow-up asks, and explicit next checkpoint ownership for each account.",
          "gpt-4.1-mini",
          "openai",
          { input: 12_700, output: 4_550, cacheRead: 870, cost: 9.92 },
        ),
      ],
    },
    "cs-deflection-playbook": {
      id: "cs-deflection-playbook",
      status: "deleted",
      startedAt: isoAgo(8 * DAY),
      model: "gpt-4.1-mini",
      provider: "openai",
      totalTokens: 220_100,
      contextTokens: 380_000,
      messages: [
        userMessage(
          "csdp-1",
          tsAgo(8 * DAY - 22 * MINUTE),
          "Draft a self-serve deflection playbook with clear guardrails.",
        ),
        assistantMessage(
          "csdp-2",
          tsAgo(8 * DAY - 14 * MINUTE),
          "Playbook drafted with eligibility criteria, guardrails, and escalation boundaries.",
          "gpt-4.1-mini",
          "openai",
          { input: 11_880, output: 4_200, cacheRead: 720, cost: 8.95 },
        ),
      ],
    },
  },
};

const SKILLS_BY_AGENT: Record<string, ResolvedSkill[]> = {
  "research-scount": [
    {
      name: "market-scan",
      description: "Track market movement and summarize strategic implications.",
      source: "openclaw-workspace",
      filePath: "/Users/demo/workspaces/research-scount/skills/market-scan/SKILL.md",
      disableModelInvocation: false,
      markdown: "# market-scan\n\nCollect competitor signals and update scenario assumptions.",
    },
    {
      name: "pricing-diff",
      description: "Compare pricing structures and discount pressure.",
      source: "openclaw-workspace",
      filePath: "/Users/demo/workspaces/research-scount/skills/pricing-diff/SKILL.md",
      disableModelInvocation: false,
      markdown: "# pricing-diff\n\nHighlight pricing shifts and likely margin impact.",
    },
    {
      name: "regional-brief",
      description: "Produce region-by-region demand outlooks.",
      source: "openclaw-built-in",
      filePath: "/Users/demo/.openclaw/skills/regional-brief/SKILL.md",
      disableModelInvocation: false,
      markdown: "# regional-brief\n\nSummarize regional variance with revision triggers.",
    },
    {
      name: "source-validation",
      description: "Validate confidence for cited research sources.",
      source: "openclaw-workspace",
      filePath: "/Users/demo/workspaces/research-scount/skills/source-validation/SKILL.md",
      disableModelInvocation: false,
      markdown: "# source-validation\n\nAssign confidence scores and identify weak evidence.",
    },
  ],
  "marketing-lead": [
    {
      name: "launch-ops",
      description: "Coordinate launch plan across channels and owners.",
      source: "openclaw-workspace",
      filePath: "/Users/demo/workspaces/marketing-lead/skills/launch-ops/SKILL.md",
      disableModelInvocation: false,
      markdown: "# launch-ops\n\nRun launch checkpoints and readiness decisions.",
    },
    {
      name: "campaign-risk",
      description: "Model campaign downside scenarios and mitigations.",
      source: "openclaw-workspace",
      filePath: "/Users/demo/workspaces/marketing-lead/skills/campaign-risk/SKILL.md",
      disableModelInvocation: false,
      markdown: "# campaign-risk\n\nDefine failure thresholds and mitigation plans.",
    },
    {
      name: "board-narrative",
      description: "Condense plans into executive-ready communication.",
      source: "openclaw-built-in",
      filePath: "/Users/demo/.openclaw/skills/board-narrative/SKILL.md",
      disableModelInvocation: false,
      markdown: "# board-narrative\n\nTranslate execution detail into board-level language.",
    },
    {
      name: "attribution-audit",
      description: "Audit attribution assumptions and reporting alignment.",
      source: "openclaw-workspace",
      filePath: "/Users/demo/workspaces/marketing-lead/skills/attribution-audit/SKILL.md",
      disableModelInvocation: false,
      markdown: "# attribution-audit\n\nSurface attribution blind spots before reviews.",
    },
  ],
  "content-manager": [
    {
      name: "calendar-orchestrator",
      description: "Build editorial calendars with channel dependencies.",
      source: "openclaw-workspace",
      filePath: "/Users/demo/workspaces/content-manager/skills/calendar-orchestrator/SKILL.md",
      disableModelInvocation: false,
      markdown: "# calendar-orchestrator\n\nMap content arcs, deadlines, and dependencies.",
    },
    {
      name: "seo-cluster-planner",
      description: "Design topic clusters and canonical structures.",
      source: "openclaw-workspace",
      filePath: "/Users/demo/workspaces/content-manager/skills/seo-cluster-planner/SKILL.md",
      disableModelInvocation: false,
      markdown: "# seo-cluster-planner\n\nAlign pillar pages and supporting content.",
    },
    {
      name: "repurpose-kit",
      description: "Generate repurposing plans for all major channels.",
      source: "openclaw-built-in",
      filePath: "/Users/demo/.openclaw/skills/repurpose-kit/SKILL.md",
      disableModelInvocation: false,
      markdown: "# repurpose-kit\n\nTurn long-form assets into channel-specific derivatives.",
    },
    {
      name: "editorial-qc",
      description: "Run consistency and style checks pre-publish.",
      source: "openclaw-workspace",
      filePath: "/Users/demo/workspaces/content-manager/skills/editorial-qc/SKILL.md",
      disableModelInvocation: false,
      markdown: "# editorial-qc\n\nValidate clarity, tone, and metadata quality.",
    },
  ],
  "personal-assistant": [
    {
      name: "exec-brief",
      description: "Prepare concise executive briefings with fallback scripts.",
      source: "openclaw-workspace",
      filePath: "/Users/demo/workspaces/personal-assistant/skills/exec-brief/SKILL.md",
      disableModelInvocation: false,
      markdown: "# exec-brief\n\nCreate verbal-ready briefings with contingencies.",
    },
    {
      name: "calendar-coordination",
      description: "Coordinate schedules, travel, and prep dependencies.",
      source: "openclaw-workspace",
      filePath: "/Users/demo/workspaces/personal-assistant/skills/calendar-coordination/SKILL.md",
      disableModelInvocation: false,
      markdown:
        "# calendar-coordination\n\nMerge schedules and hard constraints into one timeline.",
    },
    {
      name: "decision-log",
      description: "Capture decision records and follow-through owners.",
      source: "openclaw-built-in",
      filePath: "/Users/demo/.openclaw/skills/decision-log/SKILL.md",
      disableModelInvocation: false,
      markdown: "# decision-log\n\nTrack decisions, rationale, and unresolved questions.",
    },
    {
      name: "meeting-pack",
      description: "Create meeting packets from scattered inputs.",
      source: "openclaw-workspace",
      filePath: "/Users/demo/workspaces/personal-assistant/skills/meeting-pack/SKILL.md",
      disableModelInvocation: false,
      markdown: "# meeting-pack\n\nAssemble concise packets with context and asks.",
    },
  ],
  "customer-support": [
    {
      name: "escalation-digest",
      description: "Generate customer-safe escalation summaries.",
      source: "openclaw-workspace",
      filePath: "/Users/demo/workspaces/customer-support/skills/escalation-digest/SKILL.md",
      disableModelInvocation: false,
      markdown: "# escalation-digest\n\nSummarize high-severity support cases safely.",
    },
    {
      name: "response-quality",
      description: "Score support replies for clarity and tone.",
      source: "openclaw-workspace",
      filePath: "/Users/demo/workspaces/customer-support/skills/response-quality/SKILL.md",
      disableModelInvocation: false,
      markdown: "# response-quality\n\nAudit quality and consistency in outbound responses.",
    },
    {
      name: "deflection-playbook",
      description: "Design self-serve pathways with guardrails.",
      source: "openclaw-built-in",
      filePath: "/Users/demo/.openclaw/skills/deflection-playbook/SKILL.md",
      disableModelInvocation: false,
      markdown: "# deflection-playbook\n\nImprove deflection while preserving escalation safety.",
    },
    {
      name: "incident-comms",
      description: "Draft incident communication templates.",
      source: "openclaw-workspace",
      filePath: "/Users/demo/workspaces/customer-support/skills/incident-comms/SKILL.md",
      disableModelInvocation: false,
      markdown: "# incident-comms\n\nGenerate update templates for active incidents.",
    },
  ],
};

const TOOLS_BY_AGENT: Record<string, ResolvedTool[]> = {
  "research-scount": [
    { name: "web_search", description: "Search the web", category: "Web", propertiesCount: 2 },
    { name: "web_fetch", description: "Fetch web content", category: "Web", propertiesCount: 2 },
    {
      name: "memory_search",
      description: "Semantic search memories",
      category: "Memory",
      propertiesCount: 2,
    },
    { name: "read", description: "Read file contents", category: "Files", propertiesCount: 3 },
  ],
  "marketing-lead": [
    { name: "read", description: "Read file contents", category: "Files", propertiesCount: 3 },
    {
      name: "apply_patch",
      description: "Apply multi-file patches",
      category: "Files",
      propertiesCount: 2,
    },
    { name: "exec", description: "Run shell commands", category: "Runtime", propertiesCount: 4 },
    { name: "message", description: "Send messages", category: "Messaging", propertiesCount: 3 },
  ],
  "content-manager": [
    { name: "read", description: "Read file contents", category: "Files", propertiesCount: 3 },
    {
      name: "write",
      description: "Create or overwrite files",
      category: "Files",
      propertiesCount: 2,
    },
    { name: "edit", description: "Make precise edits", category: "Files", propertiesCount: 2 },
    {
      name: "sessions_history",
      description: "Fetch session history",
      category: "Sessions",
      propertiesCount: 2,
    },
  ],
  "personal-assistant": [
    { name: "read", description: "Read file contents", category: "Files", propertiesCount: 3 },
    {
      name: "sessions_list",
      description: "List sessions",
      category: "Sessions",
      propertiesCount: 2,
    },
    { name: "message", description: "Send messages", category: "Messaging", propertiesCount: 3 },
    {
      name: "cron",
      description: "Manage cron jobs",
      category: "Infrastructure",
      propertiesCount: 4,
    },
  ],
  "customer-support": [
    {
      name: "sessions_list",
      description: "List sessions",
      category: "Sessions",
      propertiesCount: 2,
    },
    {
      name: "sessions_history",
      description: "Fetch session history",
      category: "Sessions",
      propertiesCount: 2,
    },
    { name: "message", description: "Send messages", category: "Messaging", propertiesCount: 3 },
    {
      name: "memory_get",
      description: "Read memory files",
      category: "Memory",
      propertiesCount: 2,
    },
  ],
};

const CRON_JOBS: CronJob[] = [
  {
    id: "cron-research-daily-signal",
    name: "Research Daily Signal",
    enabled: true,
    deleteAfterRun: false,
    createdAtMs: NOW - 18 * DAY,
    updatedAtMs: NOW - 70 * MINUTE,
    schedule: { kind: "cron", cron: "15 7 * * 1-5" },
    sessionTarget: "research-scount",
    wakeMode: "ifSleeping",
    payload: { kind: "text", text: "Summarize top market shifts and confidence levels." },
    state: {
      lastRunAtMs: NOW - 70 * MINUTE,
      lastRunStatus: "ok",
      nextRunAtMs: NOW + 23 * HOUR,
    },
  },
  {
    id: "cron-marketing-kpi-digest",
    name: "Marketing KPI Digest",
    enabled: true,
    deleteAfterRun: false,
    createdAtMs: NOW - 15 * DAY,
    updatedAtMs: NOW - 32 * MINUTE,
    schedule: { kind: "cron", cron: "*/30 * * * *" },
    sessionTarget: "marketing-lead",
    wakeMode: "always",
    payload: { kind: "text", text: "Compile campaign KPI movement and risk signals." },
    state: {
      lastRunAtMs: NOW - 32 * MINUTE,
      lastRunStatus: "error",
      nextRunAtMs: NOW + 28 * MINUTE,
    },
  },
  {
    id: "cron-content-calendar-sync",
    name: "Content Calendar Sync",
    enabled: true,
    deleteAfterRun: false,
    createdAtMs: NOW - 12 * DAY,
    updatedAtMs: NOW - 95 * MINUTE,
    schedule: { kind: "cron", cron: "0 */6 * * *" },
    sessionTarget: "content-manager",
    wakeMode: "ifSleeping",
    payload: { kind: "text", text: "Reconcile content calendar against launch dependencies." },
    state: {
      lastRunAtMs: NOW - 95 * MINUTE,
      lastRunStatus: "ok",
      nextRunAtMs: NOW + 5 * HOUR,
    },
  },
  {
    id: "cron-pa-exec-brief",
    name: "Executive Brief Auto-Draft",
    enabled: true,
    deleteAfterRun: false,
    createdAtMs: NOW - 8 * DAY,
    updatedAtMs: NOW - 3 * HOUR,
    schedule: { kind: "cron", cron: "0 6 * * 1-5" },
    sessionTarget: "personal-assistant",
    wakeMode: "always",
    payload: { kind: "text", text: "Draft daily executive briefing with fallback script." },
    state: {
      lastRunAtMs: NOW - 3 * HOUR,
      lastRunStatus: "ok",
      nextRunAtMs: NOW + 18 * HOUR,
    },
  },
  {
    id: "cron-support-escalation-scan",
    name: "Escalation Scan",
    enabled: false,
    deleteAfterRun: false,
    createdAtMs: NOW - 11 * DAY,
    updatedAtMs: NOW - 5 * HOUR,
    schedule: { kind: "cron", cron: "0 8,16 * * *" },
    sessionTarget: "customer-support",
    wakeMode: "ifSleeping",
    payload: { kind: "text", text: "Summarize active escalations and outbound commitments." },
    state: {
      lastRunAtMs: NOW - 29 * HOUR,
      lastRunStatus: "ok",
      nextRunAtMs: NOW + 3 * HOUR,
    },
  },
];

const CRON_RUNS: CronRun[] = [
  {
    jobId: "cron-marketing-kpi-digest",
    status: "error",
    summary: "Attribution API timeout while calculating blended CAC",
    runAtMs: NOW - 32 * MINUTE,
    durationMs: 46_900,
    nextRunAtMs: NOW + 28 * MINUTE,
    finishedAtMs: NOW - 31 * MINUTE,
  },
  {
    jobId: "cron-research-daily-signal",
    status: "ok",
    summary: "Published daily signal report with 7 high-confidence changes",
    runAtMs: NOW - 70 * MINUTE,
    durationMs: 29_400,
    nextRunAtMs: NOW + 23 * HOUR,
    finishedAtMs: NOW - 69 * MINUTE,
  },
  {
    jobId: "cron-content-calendar-sync",
    status: "ok",
    summary: "Updated editorial dependencies and blocked 2 risky publish slots",
    runAtMs: NOW - 95 * MINUTE,
    durationMs: 34_100,
    nextRunAtMs: NOW + 5 * HOUR,
    finishedAtMs: NOW - 94 * MINUTE,
  },
  {
    jobId: "cron-pa-exec-brief",
    status: "ok",
    summary: "Prepared executive draft with contingency talking points",
    runAtMs: NOW - 3 * HOUR,
    durationMs: 41_700,
    nextRunAtMs: NOW + 18 * HOUR,
    finishedAtMs: NOW - 2 * HOUR - 18 * MINUTE,
  },
  {
    jobId: "cron-support-escalation-scan",
    status: "ok",
    summary: "Generated escalation summary for outbound comms",
    runAtMs: NOW - 29 * HOUR,
    durationMs: 26_300,
    nextRunAtMs: NOW + 3 * HOUR,
    finishedAtMs: NOW - 29 * HOUR + 26_300,
  },
].sort((a, b) => b.finishedAtMs - a.finishedAtMs);

const GATEWAY_INFO: GatewayInfo = {
  port: 18789,
  mode: "local",
  bind: "loopback",
  wsUrl: "ws://127.0.0.1:18789",
  auth: { mode: "token", token: "demo-gateway-token-advanced" },
  tailscale: { mode: "off", resetOnExit: false },
  deniedCommands: ["rm -rf /", "shutdown", "reboot", "mkfs"],
  version: "0.16.0-demo",
  lastTouchedAt: isoAgo(10 * HOUR),
  pid: 4343,
  startedAt: isoAgo(5 * HOUR + 20 * MINUTE),
  healthMonitor: { interval: 15, grace: 45 },
  cronEnabled: true,
  cronJobCount: CRON_JOBS.length,
};

const PAIRED_DEVICES: PairedDevice[] = [
  {
    deviceId: "device-macbook-pro-14",
    platform: "macos",
    clientId: "martin-mbp",
    clientMode: "desktop",
    role: "operator",
    scopes: ["sessions", "gateway", "cron"],
    createdAtMs: NOW - 24 * DAY,
    approvedAtMs: NOW - 24 * DAY + 5 * MINUTE,
    lastUsedAtMs: NOW - 8 * MINUTE,
  },
  {
    deviceId: "device-linux-ci-runner",
    platform: "linux",
    clientId: "ci-runner-2",
    clientMode: "headless",
    role: "automation",
    scopes: ["sessions", "logs"],
    createdAtMs: NOW - 13 * DAY,
    approvedAtMs: NOW - 13 * DAY + 2 * MINUTE,
    lastUsedAtMs: NOW - 78 * MINUTE,
  },
  {
    deviceId: "device-ipad-field",
    platform: "ios",
    clientId: "field-ipad",
    clientMode: "mobile",
    role: "observer",
    scopes: ["gateway", "sessions"],
    createdAtMs: NOW - 7 * DAY,
    approvedAtMs: NOW - 7 * DAY + 4 * MINUTE,
    lastUsedAtMs: NOW - 2 * HOUR,
  },
];

const CHANNELS_STATUS: ChannelsStatus = {
  openclawDir: OPENCLAW_DIR,
  channels: [
    {
      id: "slack",
      enabled: true,
      dmPolicy: "allow",
      groupRuleCount: 3,
      config: {
        enabled: true,
        dmPolicy: "allow",
        pollIntervalMs: 5000,
        workspace: "acme-internal",
      },
      sessionCount: 28,
      lastSeenAt: isoAgo(3 * MINUTE),
      accountIds: ["U024BE7LH", "U8472H12", "U9033AB22"],
      agentIds: ["personal-assistant", "customer-support", "marketing-lead"],
      stateDirPath: `${OPENCLAW_DIR}/slack`,
      stateDirExists: true,
      stateFiles: [
        {
          name: "update-offset-U024BE7LH.json",
          path: `${OPENCLAW_DIR}/slack/update-offset-U024BE7LH.json`,
          sizeBytes: 224,
          modifiedAt: isoAgo(3 * MINUTE),
        },
        {
          name: "command-hash-U024BE7LH-20260304.json",
          path: `${OPENCLAW_DIR}/slack/command-hash-U024BE7LH-20260304.json`,
          sizeBytes: 9_412,
          modifiedAt: isoAgo(42 * MINUTE),
        },
      ],
      credentialFiles: [
        {
          name: "slack.json",
          path: `${OPENCLAW_DIR}/credentials/slack.json`,
          sizeBytes: 1_640,
          modifiedAt: isoAgo(4 * DAY),
        },
        {
          name: "slack-U024BE7LH-allowFrom.json",
          path: `${OPENCLAW_DIR}/credentials/slack-U024BE7LH-allowFrom.json`,
          sizeBytes: 202,
          modifiedAt: isoAgo(10 * DAY),
        },
      ],
    },
    {
      id: "email",
      enabled: true,
      dmPolicy: "allow",
      groupRuleCount: 2,
      config: {
        enabled: true,
        sender: "ops@acme.com",
        queue: "priority",
      },
      sessionCount: 13,
      lastSeenAt: isoAgo(17 * MINUTE),
      accountIds: ["ops@acme.com"],
      agentIds: ["customer-support", "personal-assistant"],
      stateDirPath: `${OPENCLAW_DIR}/email`,
      stateDirExists: true,
      stateFiles: [
        {
          name: "update-offset-ops@acme.com.json",
          path: `${OPENCLAW_DIR}/email/update-offset-ops@acme.com.json`,
          sizeBytes: 204,
          modifiedAt: isoAgo(17 * MINUTE),
        },
      ],
      credentialFiles: [
        {
          name: "email.json",
          path: `${OPENCLAW_DIR}/credentials/email.json`,
          sizeBytes: 1240,
          modifiedAt: isoAgo(9 * DAY),
        },
      ],
    },
    {
      id: "telegram",
      enabled: false,
      dmPolicy: "deny",
      groupRuleCount: 1,
      config: {
        enabled: false,
        dmPolicy: "deny",
        polling: { timeoutSeconds: 20 },
      },
      sessionCount: 4,
      lastSeenAt: isoAgo(2 * DAY + 4 * HOUR),
      accountIds: ["tg_8891201"],
      agentIds: ["research-scount"],
      stateDirPath: `${OPENCLAW_DIR}/telegram`,
      stateDirExists: true,
      stateFiles: [
        {
          name: "update-offset-tg_8891201.json",
          path: `${OPENCLAW_DIR}/telegram/update-offset-tg_8891201.json`,
          sizeBytes: 188,
          modifiedAt: isoAgo(2 * DAY + 4 * HOUR),
        },
      ],
      credentialFiles: [
        {
          name: "telegram.json",
          path: `${OPENCLAW_DIR}/credentials/telegram.json`,
          sizeBytes: 910,
          modifiedAt: isoAgo(12 * DAY),
        },
      ],
    },
  ],
};

const HEARTBEAT_EVENTS: HeartbeatLogEntry[] = [
  { timestamp: isoAgo(2 * MINUTE), intervalMs: 1_800_000, agentId: "personal-assistant" },
  { timestamp: isoAgo(6 * MINUTE), intervalMs: 1_800_000, agentId: "customer-support" },
  { timestamp: isoAgo(10 * MINUTE), intervalMs: 1_800_000, agentId: "marketing-lead" },
  { timestamp: isoAgo(14 * MINUTE), intervalMs: 1_800_000, agentId: "content-manager" },
  { timestamp: isoAgo(18 * MINUTE), intervalMs: 1_800_000, agentId: "research-scount" },
  { timestamp: isoAgo(22 * MINUTE), intervalMs: 1_800_000, agentId: "personal-assistant" },
  { timestamp: isoAgo(26 * MINUTE), intervalMs: 1_800_000, agentId: "customer-support" },
  { timestamp: isoAgo(30 * MINUTE), intervalMs: 1_800_000, agentId: "marketing-lead" },
];

const HEARTBEAT_STATUS: HeartbeatStatus = {
  defaultAgentId: "personal-assistant",
  agents: [
    {
      agentId: "research-scount",
      agentName: "Research Scount",
      enabled: true,
      every: "30m",
      everyMs: 1_800_000,
    },
    {
      agentId: "marketing-lead",
      agentName: "Marketing Lead",
      enabled: true,
      every: "30m",
      everyMs: 1_800_000,
    },
    {
      agentId: "content-manager",
      agentName: "Content Manager",
      enabled: true,
      every: "30m",
      everyMs: 1_800_000,
    },
    {
      agentId: "personal-assistant",
      agentName: "Personal Assistant",
      enabled: true,
      every: "30m",
      everyMs: 1_800_000,
    },
    {
      agentId: "customer-support",
      agentName: "Customer Support",
      enabled: false,
      every: "disabled",
      everyMs: null,
    },
  ],
  sessions: [
    {
      agentId: "research-scount",
      agentName: "Research Scount",
      sessionCount: 2,
      activeSessionCount: 1,
      lastActivity: isoAgo(11 * MINUTE),
      totalTokens: 320_400,
      contextTokens: 400_000,
      percentUsed: 80,
      model: "claude-3-7-sonnet",
    },
    {
      agentId: "marketing-lead",
      agentName: "Marketing Lead",
      sessionCount: 2,
      activeSessionCount: 1,
      lastActivity: isoAgo(18 * MINUTE),
      totalTokens: 289_902,
      contextTokens: 350_000,
      percentUsed: 83,
      model: "gpt-5",
    },
    {
      agentId: "content-manager",
      agentName: "Content Manager",
      sessionCount: 2,
      activeSessionCount: 1,
      lastActivity: isoAgo(22 * MINUTE),
      totalTokens: 214_335,
      contextTokens: 300_000,
      percentUsed: 71,
      model: "gpt-4.1-mini",
    },
    {
      agentId: "personal-assistant",
      agentName: "Personal Assistant",
      sessionCount: 2,
      activeSessionCount: 2,
      lastActivity: isoAgo(5 * MINUTE),
      totalTokens: 348_550,
      contextTokens: 450_000,
      percentUsed: 77,
      model: "gpt-5",
    },
    {
      agentId: "customer-support",
      agentName: "Customer Support",
      sessionCount: 2,
      activeSessionCount: 1,
      lastActivity: isoAgo(9 * MINUTE),
      totalTokens: 305_221,
      contextTokens: 380_000,
      percentUsed: 80,
      model: "gpt-4.1",
    },
  ],
  recentHeartbeatEvents: HEARTBEAT_EVENTS,
  heartbeatFilePaths: [
    {
      agentId: "research-scount",
      path: "/Users/demo/workspaces/research-scount/HEARTBEAT.md",
      exists: true,
    },
    {
      agentId: "marketing-lead",
      path: "/Users/demo/workspaces/marketing-lead/HEARTBEAT.md",
      exists: true,
    },
    {
      agentId: "content-manager",
      path: "/Users/demo/workspaces/content-manager/HEARTBEAT.md",
      exists: true,
    },
    {
      agentId: "personal-assistant",
      path: "/Users/demo/workspaces/personal-assistant/HEARTBEAT.md",
      exists: true,
    },
    {
      agentId: "customer-support",
      path: "/Users/demo/workspaces/customer-support/HEARTBEAT.md",
      exists: false,
    },
  ],
  lastHeartbeatAt: HEARTBEAT_EVENTS[0]?.timestamp ?? null,
  gatewayRunning: true,
};

function usageRecord(
  msAgo: number,
  sessionId: string,
  agentId: string,
  model: string,
  provider: string,
  inputTokens: number,
  outputTokens: number,
  cachedTokens: number,
  cost: number,
): UsageRecord {
  return {
    timestamp: NOW - msAgo,
    sessionId,
    agentId,
    agentName: AGENT_NAME_BY_ID[agentId] ?? agentId,
    model,
    provider,
    inputTokens,
    outputTokens,
    cachedTokens,
    cost,
  };
}

const PRIMARY_USAGE_RECORDS: UsageRecord[] = [
  usageRecord(
    35 * MINUTE,
    "rs-market-trends-2026",
    "research-scount",
    "claude-3-7-sonnet",
    "anthropic",
    25_400,
    9_100,
    0,
    14.6,
  ),
  usageRecord(
    90 * MINUTE,
    "pa-exec-briefing",
    "personal-assistant",
    "o3",
    "openai",
    23_300,
    8_200,
    1_200,
    13.4,
  ),
  usageRecord(
    2 * HOUR + 15 * MINUTE,
    "ml-launch-plan-spring",
    "marketing-lead",
    "gpt-5",
    "openai",
    20_900,
    7_400,
    1_600,
    11.7,
  ),
  usageRecord(
    3 * HOUR + 20 * MINUTE,
    "cs-escalation-digest",
    "customer-support",
    "gpt-4.1",
    "openai",
    17_800,
    6_200,
    1_100,
    11.0,
  ),
  usageRecord(
    4 * HOUR + 10 * MINUTE,
    "cm-content-calendar-apr",
    "content-manager",
    "gpt-4.1-mini",
    "openai",
    15_700,
    5_500,
    920,
    10.3,
  ),
  usageRecord(
    5 * HOUR + 5 * MINUTE,
    "rs-market-trends-2026",
    "research-scount",
    "gemini-2.5-pro",
    "google",
    16_900,
    6_000,
    0,
    10.4,
  ),
  usageRecord(
    5 * HOUR + 50 * MINUTE,
    "ml-launch-plan-spring",
    "marketing-lead",
    "claude-3-5-sonnet",
    "anthropic",
    14_200,
    4_900,
    0,
    10.1,
  ),
  usageRecord(
    1 * DAY + 3 * HOUR,
    "ml-launch-plan-spring",
    "marketing-lead",
    "gpt-5",
    "openai",
    23_700,
    8_300,
    1_400,
    26.4,
  ),
  usageRecord(
    2 * DAY + 4 * HOUR,
    "cm-content-calendar-apr",
    "content-manager",
    "gpt-4.1-mini",
    "openai",
    16_600,
    5_900,
    840,
    18.2,
  ),
  usageRecord(
    3 * DAY + 2 * HOUR,
    "pa-exec-briefing",
    "personal-assistant",
    "gpt-5",
    "openai",
    30_100,
    10_300,
    1_900,
    32.7,
  ),
  usageRecord(
    4 * DAY + 5 * HOUR,
    "cs-escalation-digest",
    "customer-support",
    "gpt-4.1",
    "openai",
    14_400,
    5_100,
    720,
    15.9,
  ),
  usageRecord(
    5 * DAY + 3 * HOUR,
    "rs-market-trends-2026",
    "research-scount",
    "gpt-5",
    "openai",
    26_300,
    9_000,
    1_300,
    29.4,
  ),
  usageRecord(
    6 * DAY + 4 * HOUR,
    "ml-launch-plan-spring",
    "marketing-lead",
    "claude-3-5-sonnet",
    "anthropic",
    19_500,
    6_800,
    0,
    21.1,
  ),
  usageRecord(
    7 * DAY + 2 * HOUR,
    "cm-content-calendar-apr",
    "content-manager",
    "gpt-5",
    "openai",
    12_800,
    4_700,
    620,
    13.6,
  ),
  usageRecord(
    8 * DAY + 5 * HOUR,
    "pa-travel-and-schedule",
    "personal-assistant",
    "o3",
    "openai",
    31_800,
    10_900,
    1_650,
    34.2,
  ),
  usageRecord(
    9 * DAY + 4 * HOUR,
    "cs-escalation-digest",
    "customer-support",
    "claude-3-5-haiku",
    "anthropic",
    16_200,
    5_500,
    0,
    17.8,
  ),
  usageRecord(
    10 * DAY + 3 * HOUR,
    "rs-market-trends-2026",
    "research-scount",
    "gemini-2.5-pro",
    "google",
    24_700,
    8_400,
    0,
    27.5,
  ),
  usageRecord(
    11 * DAY + 2 * HOUR,
    "ml-launch-plan-spring",
    "marketing-lead",
    "gpt-4.1",
    "openai",
    18_300,
    6_300,
    1_000,
    19.9,
  ),
  usageRecord(
    12 * DAY + 5 * HOUR,
    "cm-seo-refresh",
    "content-manager",
    "gemini-2.0-flash",
    "google",
    11_900,
    4_200,
    0,
    12.4,
  ),
  usageRecord(
    13 * DAY + 4 * HOUR,
    "pa-exec-briefing",
    "personal-assistant",
    "claude-3-7-sonnet",
    "anthropic",
    28_200,
    9_600,
    0,
    30.8,
  ),
  usageRecord(
    14 * DAY + 3 * HOUR,
    "cs-deflection-playbook",
    "customer-support",
    "gpt-4.1-mini",
    "openai",
    15_000,
    5_200,
    700,
    16.7,
  ),
  usageRecord(
    15 * DAY + 2 * HOUR,
    "rs-competitor-map-q1",
    "research-scount",
    "claude-3-7-sonnet",
    "anthropic",
    22_300,
    7_400,
    0,
    24.1,
  ),
  usageRecord(
    16 * DAY + 5 * HOUR,
    "ml-campaign-postmortem",
    "marketing-lead",
    "gpt-5",
    "openai",
    33_900,
    11_300,
    2_100,
    35.6,
  ),
  usageRecord(
    17 * DAY + 4 * HOUR,
    "cm-seo-refresh",
    "content-manager",
    "gpt-4.1-mini",
    "openai",
    13_200,
    4_700,
    620,
    14.8,
  ),
  usageRecord(
    18 * DAY + 3 * HOUR,
    "pa-travel-and-schedule",
    "personal-assistant",
    "gpt-5",
    "openai",
    25_700,
    8_700,
    1_300,
    28.2,
  ),
  usageRecord(
    19 * DAY + 2 * HOUR,
    "cs-deflection-playbook",
    "customer-support",
    "gpt-4.1",
    "openai",
    19_200,
    6_700,
    970,
    20.5,
  ),
  usageRecord(
    20 * DAY + 5 * HOUR,
    "rs-competitor-map-q1",
    "research-scount",
    "gpt-5",
    "openai",
    10_700,
    3_900,
    420,
    11.9,
  ),
  usageRecord(
    21 * DAY + 4 * HOUR,
    "ml-campaign-postmortem",
    "marketing-lead",
    "claude-3-5-sonnet",
    "anthropic",
    24_800,
    8_500,
    0,
    26.9,
  ),
  usageRecord(
    22 * DAY + 3 * HOUR,
    "cm-seo-refresh",
    "content-manager",
    "gpt-5",
    "openai",
    17_300,
    6_000,
    900,
    18.6,
  ),
  usageRecord(
    23 * DAY + 2 * HOUR,
    "pa-travel-and-schedule",
    "personal-assistant",
    "o3",
    "openai",
    29_000,
    9_900,
    1_500,
    31.3,
  ),
  usageRecord(
    24 * DAY + 5 * HOUR,
    "cs-deflection-playbook",
    "customer-support",
    "claude-3-5-haiku",
    "anthropic",
    14_000,
    4_900,
    0,
    15.4,
  ),
  usageRecord(
    25 * DAY + 4 * HOUR,
    "rs-competitor-map-q1",
    "research-scount",
    "gemini-2.5-pro",
    "google",
    21_600,
    7_200,
    0,
    23.7,
  ),
  usageRecord(
    26 * DAY + 3 * HOUR,
    "ml-launch-plan-spring",
    "marketing-lead",
    "gpt-5",
    "openai",
    30_800,
    10_700,
    1_800,
    33.0,
  ),
  usageRecord(
    27 * DAY + 2 * HOUR,
    "cm-content-calendar-apr",
    "content-manager",
    "gpt-4.1-mini",
    "openai",
    15_400,
    5_300,
    760,
    17.1,
  ),
  usageRecord(
    28 * DAY + 5 * HOUR,
    "pa-exec-briefing",
    "personal-assistant",
    "o3",
    "openai",
    23_400,
    8_100,
    1_200,
    25.2,
  ),
  usageRecord(
    29 * DAY + 4 * HOUR,
    "cs-escalation-digest",
    "customer-support",
    "gpt-4.1",
    "openai",
    13_500,
    4_700,
    650,
    14.5,
  ),
];

function usageDayKey(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

const SECONDARY_USAGE_BLUEPRINTS = [
  {
    sessionId: "cs-deflection-playbook",
    agentId: "customer-support",
    model: "claude-3-5-haiku",
    provider: "anthropic",
    inputTokens: 8_900,
    outputTokens: 3_100,
    cachedTokens: 0,
  },
  {
    sessionId: "cm-seo-refresh",
    agentId: "content-manager",
    model: "gemini-2.0-flash",
    provider: "google",
    inputTokens: 8_400,
    outputTokens: 2_900,
    cachedTokens: 0,
  },
  {
    sessionId: "pa-travel-and-schedule",
    agentId: "personal-assistant",
    model: "o3",
    provider: "openai",
    inputTokens: 9_200,
    outputTokens: 3_200,
    cachedTokens: 420,
  },
  {
    sessionId: "ml-campaign-postmortem",
    agentId: "marketing-lead",
    model: "claude-3-5-sonnet",
    provider: "anthropic",
    inputTokens: 9_600,
    outputTokens: 3_300,
    cachedTokens: 0,
  },
  {
    sessionId: "rs-competitor-map-q1",
    agentId: "research-scount",
    model: "gemini-2.5-pro",
    provider: "google",
    inputTokens: 8_700,
    outputTokens: 3_000,
    cachedTokens: 0,
  },
  {
    sessionId: "cs-escalation-digest",
    agentId: "customer-support",
    model: "gpt-4.1",
    provider: "openai",
    inputTokens: 8_800,
    outputTokens: 3_000,
    cachedTokens: 380,
  },
];

const primaryModelsByDay = new Map<string, Set<string>>();
for (const record of PRIMARY_USAGE_RECORDS) {
  const key = usageDayKey(record.timestamp);
  const existing = primaryModelsByDay.get(key) ?? new Set<string>();
  existing.add(record.model);
  primaryModelsByDay.set(key, existing);
}

const SECONDARY_USAGE_RECORDS: UsageRecord[] = Array.from({ length: 30 }, (_, dayIndex) => {
  const msAgo = dayIndex * DAY + 9 * HOUR + 17 * MINUTE;
  const key = usageDayKey(NOW - msAgo);
  const modelsForDay = primaryModelsByDay.get(key) ?? new Set<string>();
  const fallbackBlueprint =
    SECONDARY_USAGE_BLUEPRINTS[dayIndex % SECONDARY_USAGE_BLUEPRINTS.length];
  const selectedBlueprint =
    SECONDARY_USAGE_BLUEPRINTS.find((blueprint) => !modelsForDay.has(blueprint.model)) ??
    fallbackBlueprint;

  const secondaryCost = dayIndex === 0 ? 5.0 : 5.4 + (dayIndex % 4) * 0.7;

  return usageRecord(
    msAgo,
    selectedBlueprint.sessionId,
    selectedBlueprint.agentId,
    selectedBlueprint.model,
    selectedBlueprint.provider,
    selectedBlueprint.inputTokens,
    selectedBlueprint.outputTokens,
    selectedBlueprint.cachedTokens,
    secondaryCost,
  );
});

const USAGE_RECORDS: UsageRecord[] = [...PRIMARY_USAGE_RECORDS, ...SECONDARY_USAGE_RECORDS].sort(
  (a, b) => a.timestamp - b.timestamp,
);

const CORE_FILE_NAMES = [
  "AGENTS.md",
  "IDENTITY.md",
  "HEARTBEAT.md",
  "TOOLS.md",
  "SOUL.md",
  "USER.md",
  "MEMORY.md",
] as const;

function buildCoreFiles(
  overrides: Partial<Record<(typeof CORE_FILE_NAMES)[number], string>>,
): CoreFile[] {
  return CORE_FILE_NAMES.map((name) => ({
    name,
    content: overrides[name] ?? null,
  }));
}

const CORE_FILES_BY_WORKSPACE: Record<string, CoreFile[]> = {
  "/Users/demo/workspaces/research-scount": buildCoreFiles({
    "AGENTS.md": "# AGENTS\n\nResearch Scount tracks market direction and scenario risk.",
    "IDENTITY.md": "# IDENTITY\n\nAnalytical, source-driven, and explicit about confidence levels.",
    "HEARTBEAT.md": "# HEARTBEAT\n\nEvery 30m, refresh market signal confidence.",
    "TOOLS.md": "# TOOLS\n\nPrefer web search + source validation before conclusions.",
    "MEMORY.md": "# MEMORY\n\n- Re-evaluate assumptions weekly.",
  }),
  "/Users/demo/workspaces/marketing-lead": buildCoreFiles({
    "AGENTS.md": "# AGENTS\n\nMarketing Lead coordinates launch readiness and narrative.",
    "IDENTITY.md": "# IDENTITY\n\nOutcome-focused with explicit KPI accountability.",
    "HEARTBEAT.md": "# HEARTBEAT\n\nEvery 30m, check KPI deltas and campaign risks.",
    "TOOLS.md": "# TOOLS\n\nUse launch and attribution skills before board updates.",
    "MEMORY.md": "# MEMORY\n\n- Keep board narrative versioned by week.",
  }),
  "/Users/demo/workspaces/content-manager": buildCoreFiles({
    "AGENTS.md": "# AGENTS\n\nContent Manager runs calendar, SEO, and repurposing workflows.",
    "IDENTITY.md": "# IDENTITY\n\nPrecision editorial planning with execution realism.",
    "HEARTBEAT.md": "# HEARTBEAT\n\nEvery 30m, check content dependencies and blockers.",
    "TOOLS.md": "# TOOLS\n\nPrioritize calendar orchestration and editorial QC.",
    "MEMORY.md": "# MEMORY\n\n- Preserve channel-level CTA consistency.",
  }),
  "/Users/demo/workspaces/personal-assistant": buildCoreFiles({
    "AGENTS.md": "# AGENTS\n\nPersonal Assistant coordinates executive operations and briefings.",
    "IDENTITY.md": "# IDENTITY\n\nConcise, anticipatory, and dependency-aware.",
    "HEARTBEAT.md": "# HEARTBEAT\n\nEvery 30m, refresh priorities and schedule conflicts.",
    "TOOLS.md": "# TOOLS\n\nPrefer briefing and calendar skills before ad hoc drafting.",
    "SOUL.md": "# SOUL\n\nKeep communication clear under time pressure.",
    "MEMORY.md": "# MEMORY\n\n- Always attach fallback scripts for high-stakes meetings.",
  }),
  "/Users/demo/workspaces/customer-support": buildCoreFiles({
    "AGENTS.md":
      "# AGENTS\n\nCustomer Support handles escalations and external communication quality.",
    "IDENTITY.md": "# IDENTITY\n\nCalm, accurate, and customer-safe in every update.",
    "TOOLS.md": "# TOOLS\n\nUse escalation digest and incident comms patterns.",
    "USER.md": "# USER\n\nSupport leadership and incident response teams.",
    "MEMORY.md": "# MEMORY\n\n- Avoid speculative language in customer-facing updates.",
  }),
};

const DEMO_LOG_ENTRIES: LogEntry[] = [
  {
    time: isoAgo(12 * MINUTE),
    level: "INFO",
    component: "gateway/bootstrap",
    message: "Gateway listening on 127.0.0.1:18789 (PID 4343)",
  },
  {
    time: isoAgo(11 * MINUTE),
    level: "DEBUG",
    component: "cron/cron-marketing-kpi-digest",
    message: "Queued KPI digest run for marketing-lead",
  },
  {
    time: isoAgo(10 * MINUTE + 20_000),
    level: "WARN",
    component: "cron/cron-marketing-kpi-digest",
    message: "Attribution API latency exceeded 4s threshold",
  },
  {
    time: isoAgo(9 * MINUTE + 35_000),
    level: "ERROR",
    component: "cron/cron-marketing-kpi-digest",
    message: "Attribution API timeout while calculating blended CAC",
  },
  {
    time: isoAgo(8 * MINUTE + 15_000),
    level: "INFO",
    component: "sessions/pa-exec-briefing",
    message: "Session updated with executive fallback script",
  },
  {
    time: isoAgo(6 * MINUTE + 50_000),
    level: "TRACE",
    component: "gateway/heartbeat",
    message: "Heartbeat dispatched for personal-assistant",
  },
  {
    time: isoAgo(5 * MINUTE + 10_000),
    level: "TRACE",
    component: "gateway/heartbeat",
    message: "Heartbeat dispatched for customer-support",
  },
  {
    time: isoAgo(3 * MINUTE + 20_000),
    level: "DEBUG",
    component: "channels/slack",
    message: "Processed update-offset-U024BE7LH.json",
  },
  {
    time: isoAgo(2 * MINUTE + 5_000),
    level: "INFO",
    component: "gateway/health-monitor",
    message: "Health check passed in 38ms",
  },
];

function getSessionsForAgentInternal(agentId: string): SessionSummary[] {
  return SESSION_SUMMARIES_BY_AGENT[agentId] ?? [];
}

function getSessionCounts(): Record<string, SessionCounts> {
  const counts: Record<string, SessionCounts> = {};
  for (const agent of AGENTS) {
    const sessions = getSessionsForAgentInternal(agent.id);
    const active = sessions.filter((session) => session.status === "active").length;
    const archived = sessions.length - active;
    counts[agent.id] = { active, archived, total: sessions.length };
  }
  return counts;
}

function getAllSessionsInternal(): (SessionSummary & { agentName: string })[] {
  const all: (SessionSummary & { agentName: string })[] = [];

  for (const agent of AGENTS) {
    const sessions = getSessionsForAgentInternal(agent.id);
    for (const session of sessions) {
      all.push({
        ...session,
        agentName: AGENT_NAME_BY_ID[agent.id] ?? agent.id,
      });
    }
  }

  return all.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());
}

function getActiveSessionsInternal(): (SessionSummary & { agentName: string })[] {
  return getAllSessionsInternal().filter((session) => session.status === "active");
}

function getCoreFiles(workspace: string | undefined): CoreFile[] {
  if (!workspace) {
    return CORE_FILE_NAMES.map((name) => ({ name, content: null }));
  }

  const files = CORE_FILES_BY_WORKSPACE[workspace];
  if (!files) {
    return CORE_FILE_NAMES.map((name) => ({ name, content: null }));
  }

  return files;
}

export const demoProvider: DataProvider = {
  getAgents: () => clone(AGENTS),
  getSkillsForAgent: (agentId: string) => clone(SKILLS_BY_AGENT[agentId] ?? []),
  getToolsForAgent: (agentId: string) => clone(TOOLS_BY_AGENT[agentId] ?? []),
  getSessionsForAgent: (agentId: string) => clone(getSessionsForAgentInternal(agentId)),
  getSession: (agentId: string, sessionId: string) => {
    const session = SESSION_DETAILS_BY_AGENT[agentId]?.[sessionId] ?? null;
    return session ? clone(session) : null;
  },
  getAgentSessionCounts: () => clone(getSessionCounts()),
  getUsageData: () => clone(USAGE_RECORDS),
  getCronJobs: () => clone(CRON_JOBS),
  getCronRuns: () => clone(CRON_RUNS),
  getGatewayInfo: () => clone(GATEWAY_INFO),
  getPairedDevices: () => clone(PAIRED_DEVICES),
  getChannelsStatus: () => clone(CHANNELS_STATUS),
  getActiveSessions: () => clone(getActiveSessionsInternal()),
  getCoreFilesForAgent: (workspace: string | undefined) => clone(getCoreFiles(workspace)),
  getAllSessions: () => clone(getAllSessionsInternal()),
  getHeartbeatStatus: () => clone(HEARTBEAT_STATUS),
  getDemoLogEntries: () => clone(DEMO_LOG_ENTRIES),
  getDemoLogSourceLabel: () => DEMO_LOG_SOURCE_LABEL,
};

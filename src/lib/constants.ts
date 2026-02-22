export const STORAGE_KEYS = {
  USAGE_REFRESH_INTERVAL: "claw-control:usage-refresh-interval",
} as const;

export const USAGE_REFRESH_OPTIONS = [
  { label: "5 seconds", value: 5_000 },
  { label: "15 seconds", value: 15_000 },
  { label: "30 seconds", value: 30_000 },
  { label: "1 minute", value: 60_000 },
  { label: "5 minutes", value: 300_000 },
  { label: "15 minutes", value: 900_000 },
] as const;

export const DEFAULT_USAGE_REFRESH_INTERVAL = 30_000;

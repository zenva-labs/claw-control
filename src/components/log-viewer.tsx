"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownIcon,
  MaximizeIcon,
  MinimizeIcon,
  PauseIcon,
  PlayIcon,
  SearchIcon,
  TimerResetIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { STORAGE_KEYS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type LogLevel = "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";

interface LogEntry {
  time: string;
  level: string;
  component: string;
  message: string;
}

const ALL_LEVELS: LogLevel[] = ["TRACE", "DEBUG", "INFO", "WARN", "ERROR", "FATAL"];

const levelRowStyles: Record<LogLevel, string> = {
  TRACE: "text-zinc-600",
  DEBUG: "text-zinc-500",
  INFO: "text-blue-400",
  WARN: "text-amber-400",
  ERROR: "text-red-400",
  FATAL: "text-red-500 font-semibold",
};

const levelBadgeStyles: Record<LogLevel, string> = {
  TRACE: "text-zinc-600",
  DEBUG: "text-zinc-500",
  INFO: "text-blue-400",
  WARN: "text-amber-400",
  ERROR: "text-red-400",
  FATAL: "text-red-500 font-bold",
};

const levelFilterStyles: Record<LogLevel, { on: string; off: string }> = {
  TRACE: { on: "text-zinc-500", off: "text-zinc-700 line-through" },
  DEBUG: { on: "text-zinc-400", off: "text-zinc-700 line-through" },
  INFO: { on: "text-blue-400", off: "text-zinc-700 line-through" },
  WARN: { on: "text-amber-400", off: "text-zinc-700 line-through" },
  ERROR: { on: "text-red-400", off: "text-zinc-700 line-through" },
  FATAL: { on: "text-red-500", off: "text-zinc-700 line-through" },
};

const MAX_ENTRIES = 5000;

function normalizeLevel(raw: string): LogLevel {
  const upper = raw.toUpperCase();
  if (ALL_LEVELS.includes(upper as LogLevel)) return upper as LogLevel;
  return "INFO";
}

function formatTimestamp(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    });
  } catch {
    return iso;
  }
}

function HighlightedText({ text, filter }: { text: string; filter: string }) {
  if (!filter) return <>{text}</>;

  const parts: React.ReactNode[] = [];
  const lower = text.toLowerCase();
  const lowerFilter = filter.toLowerCase();
  let cursor = 0;

  while (cursor < text.length) {
    const idx = lower.indexOf(lowerFilter, cursor);
    if (idx === -1) {
      parts.push(text.slice(cursor));
      break;
    }
    if (idx > cursor) parts.push(text.slice(cursor, idx));
    parts.push(
      <mark key={idx} className="rounded-sm bg-yellow-400/50 text-inherit">
        {text.slice(idx, idx + filter.length)}
      </mark>,
    );
    cursor = idx + filter.length;
  }

  return <>{parts}</>;
}

type LogViewerProps = {
  paused: boolean;
  onPausedChange: (paused: boolean) => void;
  onFilePathChange?: (path: string) => void;
};

export function LogViewer({ paused, onPausedChange, onFilePathChange }: LogViewerProps) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [storedLevels, setStoredLevels] = useLocalStorage<LogLevel[]>(STORAGE_KEYS.LOG_LEVELS, [
    ...ALL_LEVELS,
  ]);
  const enabledLevels = useMemo(() => new Set(storedLevels), [storedLevels]);
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const bufferRef = useRef<LogEntry[]>([]);

  const onPausedChangeRef = useRef(onPausedChange);
  onPausedChangeRef.current = onPausedChange;
  const onFilePathChangeRef = useRef(onFilePathChange);
  onFilePathChangeRef.current = onFilePathChange;

  useEffect(() => {
    setEntries([]);
    setAutoScroll(true);
    onPausedChangeRef.current(false);
    bufferRef.current = [];

    const es = new EventSource("/api/logs");

    es.addEventListener("meta", (event) => {
      const meta = JSON.parse(event.data);
      if (meta.file) onFilePathChangeRef.current?.(meta.file);
    });

    es.onmessage = (event) => {
      const batch: LogEntry[] = JSON.parse(event.data);
      bufferRef.current = bufferRef.current.concat(batch);
      if (bufferRef.current.length > MAX_ENTRIES) {
        bufferRef.current = bufferRef.current.slice(-MAX_ENTRIES);
      }
      setEntries([...bufferRef.current]);
    };

    return () => es.close();
  }, []);

  const frozenRef = useRef<LogEntry[]>([]);
  const prevPausedRef = useRef(paused);
  if (paused && !prevPausedRef.current) {
    frozenRef.current = entries;
  }
  prevPausedRef.current = paused;

  const visibleEntries = paused ? frozenRef.current : entries;

  useEffect(() => {
    if (autoScroll && !paused && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "instant" });
    }
  }, [visibleEntries, autoScroll, paused]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(atBottom);
  }, []);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setAutoScroll(true);
  }, []);

  const clearEntries = useCallback(() => {
    bufferRef.current = [];
    frozenRef.current = [];
    setEntries([]);
  }, []);

  const toggleLevel = useCallback(
    (level: LogLevel) => {
      setStoredLevels((prev) => {
        const set = new Set(prev);
        if (set.has(level)) set.delete(level);
        else set.add(level);
        return [...set];
      });
    },
    [setStoredLevels],
  );

  useEffect(() => {
    if (!fullscreen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [fullscreen]);

  const lowerFilter = filter.toLowerCase();
  const filtered = useMemo(() => {
    let result = visibleEntries;
    if (enabledLevels.size < ALL_LEVELS.length) {
      result = result.filter((e) => enabledLevels.has(normalizeLevel(e.level)));
    }
    if (filter) {
      result = result.filter(
        (e) =>
          e.message.toLowerCase().includes(lowerFilter) ||
          e.component.toLowerCase().includes(lowerFilter),
      );
    }
    return result;
  }, [visibleEntries, filter, lowerFilter, enabledLevels]);

  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        fullscreen ? "bg-background fixed inset-0 z-50 p-4" : "h-[calc(100vh-10rem)]",
      )}
    >
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
          <Input
            placeholder="Filter logs..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-8 pl-8 font-mono text-xs"
          />
        </div>
        <div className="flex rounded-md border">
          {ALL_LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => toggleLevel(level)}
              className={cn(
                "px-2 py-1.5 text-xs font-medium transition-colors",
                enabledLevels.has(level)
                  ? levelFilterStyles[level].on
                  : levelFilterStyles[level].off,
              )}
            >
              {level}
            </button>
          ))}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={paused ? "outline" : "ghost"}
              size="icon-sm"
              onClick={() => {
                if (paused) {
                  setAutoScroll(true);
                  requestAnimationFrame(() =>
                    bottomRef.current?.scrollIntoView({ behavior: "instant" }),
                  );
                }
                onPausedChange(!paused);
              }}
            >
              {paused ? <PlayIcon className="size-3.5" /> : <PauseIcon className="size-3.5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{paused ? "Resume" : "Pause"}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={clearEntries}>
              <TimerResetIcon className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Clear</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={() => setFullscreen((f) => !f)}>
              {fullscreen ? (
                <MinimizeIcon className="size-3.5" />
              ) : (
                <MaximizeIcon className="size-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent align="end">
            {fullscreen ? "Exit fullscreen" : "Fullscreen"}
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-md border">
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto bg-zinc-950 p-3 font-mono text-xs leading-5"
        >
          {filtered.length === 0 ? (
            <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
              {visibleEntries.length === 0 ? "Waiting for logs..." : "No matching lines"}
            </div>
          ) : (
            filtered.map((entry, i) => {
              const level = normalizeLevel(entry.level);
              return (
                <div
                  key={i}
                  className={cn("flex gap-3 whitespace-pre-wrap", levelRowStyles[level])}
                >
                  <span className="shrink-0 text-zinc-600">{formatTimestamp(entry.time)}</span>
                  <span className={cn("w-11 shrink-0 text-right", levelBadgeStyles[level])}>
                    {level}
                  </span>
                  <span className="w-36 shrink-0 truncate text-zinc-500">
                    <HighlightedText text={entry.component} filter={filter} />
                  </span>
                  <span className="min-w-0 break-all">
                    <HighlightedText text={entry.message} filter={filter} />
                  </span>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {!autoScroll && !paused && (
          <Button
            variant="secondary"
            size="sm"
            onClick={scrollToBottom}
            className="absolute right-3 bottom-3 gap-1 opacity-90 shadow-md"
          >
            <ArrowDownIcon className="size-3" />
            Scroll to bottom
          </Button>
        )}
      </div>
    </div>
  );
}

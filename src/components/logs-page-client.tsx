"use client";

import { useState } from "react";
import { LogViewer } from "@/components/log-viewer";

export function LogsPageClient() {
  const [paused, setPaused] = useState(false);
  const [filePath, setFilePath] = useState<string | null>(null);

  return (
    <div className="relative space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Logs</h1>
          <p className="text-muted-foreground text-sm">Live tail of OpenClaw logs.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="bg-background text-muted-foreground flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
            {paused ? (
              <>
                <span className="relative flex size-2">
                  <span className="relative inline-flex size-2 rounded-full bg-yellow-500" />
                </span>
                Paused
              </>
            ) : (
              <>
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-green-500" />
                </span>
                Live
              </>
            )}
          </div>
          {filePath && <span className="text-muted-foreground font-mono text-xs">{filePath}</span>}
        </div>
      </div>
      <LogViewer paused={paused} onPausedChange={setPaused} onFilePathChange={setFilePath} />
    </div>
  );
}

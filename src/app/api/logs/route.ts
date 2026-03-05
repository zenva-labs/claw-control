import fs from "fs";
import path from "path";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const LOGS_DIR = "/tmp/openclaw";

/* oxlint-disable-next-line no-control-regex */
const ANSI_RE = /\u001b\[[0-9;]*m/g;

function getLatestLogFile(): string | null {
  try {
    const files = fs
      .readdirSync(LOGS_DIR)
      .filter((f) => f.startsWith("openclaw-") && f.endsWith(".log"));
    if (files.length === 0) return null;

    let latest = files[0];
    let latestMtime = fs.statSync(path.join(LOGS_DIR, latest)).mtimeMs;
    for (let i = 1; i < files.length; i++) {
      const mtime = fs.statSync(path.join(LOGS_DIR, files[i])).mtimeMs;
      if (mtime > latestMtime) {
        latest = files[i];
        latestMtime = mtime;
      }
    }
    return path.join(LOGS_DIR, latest);
  } catch {
    return null;
  }
}

interface ParsedLogEntry {
  time: string;
  level: string;
  component: string;
  message: string;
}

function parseLine(raw: string): ParsedLogEntry | null {
  try {
    const obj = JSON.parse(raw);
    const meta = obj._meta ?? {};
    const level = (meta.logLevelName ?? "INFO").toUpperCase();
    const time = obj.time ?? meta.date ?? "";

    let component = "";
    const name: string = meta.name ?? "";
    try {
      const parsed = JSON.parse(name);
      component = parsed.subsystem ?? name;
    } catch {
      component = name;
    }

    let message = "";
    if (typeof obj["1"] === "string") {
      message = obj["1"];
    } else if (typeof obj["0"] === "string") {
      try {
        const parsed = JSON.parse(obj["0"]);
        if (parsed.subsystem) {
          message = "";
        } else {
          message = obj["0"];
        }
      } catch {
        message = obj["0"];
      }
    }

    message = message.replace(ANSI_RE, "");

    return { time, level, component, message };
  } catch {
    return null;
  }
}

function readTailEntries(
  filePath: string,
  maxEntries: number,
): { entries: ParsedLogEntry[]; byteOffset: number } {
  try {
    const stat = fs.statSync(filePath);
    const buf = fs.readFileSync(filePath, "utf-8");
    const rawLines = buf.split("\n").filter(Boolean);
    const tail = rawLines.slice(-maxEntries);
    const entries: ParsedLogEntry[] = [];
    for (const line of tail) {
      const entry = parseLine(line);
      if (entry) entries.push(entry);
    }
    return { entries, byteOffset: stat.size };
  } catch {
    return { entries: [], byteOffset: 0 };
  }
}

export async function GET(request: NextRequest) {
  const logFile = getLatestLogFile();

  const encoder = new TextEncoder();
  const { entries: initialEntries, byteOffset: initialOffset } = logFile
    ? readTailEntries(logFile, 500)
    : { entries: [] as ParsedLogEntry[], byteOffset: 0 };
  let offset = initialOffset;
  let currentFile = logFile;

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(`event: meta\ndata: ${JSON.stringify({ file: logFile ?? LOGS_DIR })}\n\n`),
      );
      if (initialEntries.length > 0) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialEntries)}\n\n`));
      }

      let closed = false;
      let debounceTimer: ReturnType<typeof setTimeout> | null = null;

      const sendNewContent = () => {
        if (closed) return;

        const latestFile = getLatestLogFile();
        if (latestFile && latestFile !== currentFile) {
          currentFile = latestFile;
          offset = 0;
          startWatcher();
          controller.enqueue(
            encoder.encode(`event: meta\ndata: ${JSON.stringify({ file: currentFile })}\n\n`),
          );
        }

        if (!currentFile) return;

        try {
          const stat = fs.statSync(currentFile);
          if (stat.size < offset) offset = 0;
          if (stat.size > offset) {
            const fd = fs.openSync(currentFile, "r");
            const chunkSize = stat.size - offset;
            const buf = Buffer.alloc(chunkSize);
            fs.readSync(fd, buf, 0, chunkSize, offset);
            fs.closeSync(fd);
            offset = stat.size;
            const text = buf.toString("utf-8");
            const rawLines = text.split("\n").filter(Boolean);
            const entries: ParsedLogEntry[] = [];
            for (const line of rawLines) {
              const entry = parseLine(line);
              if (entry) entries.push(entry);
            }
            if (entries.length > 0) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(entries)}\n\n`));
            }
          }
        } catch {
          // File may not exist yet
        }
      };

      let watcher: fs.FSWatcher | null = null;
      const startWatcher = () => {
        try {
          watcher?.close();
          if (!currentFile) return;
          watcher = fs.watch(currentFile, { persistent: false }, () => {
            if (closed) return;
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(sendNewContent, 100);
          });
        } catch {
          // File may not exist yet
        }
      };
      startWatcher();

      // Periodically check for a newer log file
      const rolloverCheck = setInterval(() => {
        if (closed) return;
        sendNewContent();
      }, 30000);

      const heartbeat = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          cleanup();
        }
      }, 15000);

      const cleanup = () => {
        if (closed) return;
        closed = true;
        if (debounceTimer) clearTimeout(debounceTimer);
        clearInterval(heartbeat);
        clearInterval(rolloverCheck);
        watcher?.close();
      };

      request.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

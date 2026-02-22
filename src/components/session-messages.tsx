"use client";

import { useState } from "react";
import type { SessionMessage, ContentBlock } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

function formatUserText(text: string): string {
  const tsMatch = text.match(/\[[A-Z][a-z]{2}\s\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}\s\w+\]\s*(.*)/s);
  if (tsMatch) return tsMatch[1];
  if (text.startsWith("A new session was started")) return "";
  return text;
}

function classifyUserMessage(text: string): "user" | "system" | "startup" {
  if (text.startsWith("A new session was started")) return "startup";
  if (text.includes("[System Message]")) return "system";
  return "user";
}

function ThinkingBlock({ thinking }: { thinking: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="text-muted-foreground hover:text-foreground hover:bg-accent -ml-2 flex w-full cursor-pointer items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs">
        <span className="text-[10px]">{open ? "▼" : "▶"}</span>
        <span className="italic">Thinking</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="bg-muted/50 text-foreground mt-1 max-h-[400px] overflow-auto rounded-md p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">
          {thinking}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function ToolCallBlock({ block, result }: { block: ContentBlock; result?: ContentBlock }) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="hover:text-foreground hover:bg-accent -ml-2 flex w-full cursor-pointer items-center gap-1.5 rounded-sm px-2 py-1 text-xs">
        <span className="text-[10px]">{open ? "▼" : "▶"}</span>
        <Badge variant="outline" className="px-1.5 py-0 font-mono text-[11px]">
          {block.toolName}
        </Badge>
        {result?.isError && (
          <Badge variant="destructive" className="px-1 py-0 text-[10px]">
            error
          </Badge>
        )}
        {!open && block.toolArguments && Object.keys(block.toolArguments).length > 0 && (
          <span className="text-muted-foreground truncate font-mono">
            {JSON.stringify(block.toolArguments)}
          </span>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="bg-muted/50 mt-1 space-y-3 rounded-md p-3 font-mono text-xs">
          {block.toolArguments && Object.keys(block.toolArguments).length > 0 && (
            <div>
              <div className="text-muted-foreground mb-1 text-[10px] tracking-wider uppercase">
                Arguments
              </div>
              <pre className="leading-relaxed whitespace-pre-wrap">
                {JSON.stringify(block.toolArguments, null, 2)}
              </pre>
            </div>
          )}
          {result?.toolResultContent && (
            <div>
              <div className="text-muted-foreground mb-1 text-[10px] tracking-wider uppercase">
                Result
              </div>
              <pre className="max-h-[300px] overflow-auto leading-relaxed whitespace-pre-wrap">
                {result.toolResultContent}
              </pre>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function UserBubble({ message }: { message: SessionMessage }) {
  const rawText = message.content.find((b) => b.type === "text")?.text || "";
  const kind = classifyUserMessage(rawText);
  const formatted = formatUserText(rawText);

  if (kind === "startup" || !formatted) return null;

  const isSystem = kind === "system";

  return (
    <div
      className={cn("max-w-2xl self-end rounded-md bg-blue-50 px-4 py-3 dark:bg-blue-950", {
        "bg-purple-50 dark:bg-purple-950": isSystem,
      })}
    >
      <div className="mb-1 flex items-center gap-2">
        <span className="text-xs font-medium">{isSystem ? "System" : "User"}</span>
        <time className="text-muted-foreground dark:text-foreground text-[11px]">
          {format(message.timestamp, "MMM d, yyyy, h:mm a")}
        </time>
      </div>
      <div className="text-sm leading-relaxed whitespace-pre-wrap">{formatted}</div>
    </div>
  );
}

function AssistantBubble({
  message,
  toolResults,
}: {
  message: SessionMessage;
  toolResults: Map<string, ContentBlock>;
}) {
  return (
    <div className="border-muted-foreground/40 border-l-2 py-2 pl-4">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium">Assistant</span>
        {message.model && (
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
            {message.model}
          </Badge>
        )}
        <time className="text-muted-foreground text-[11px]">
          {format(message.timestamp, "MMM d, yyyy, h:mm a")}
        </time>
        {message.usage?.cost != null && (
          <span className="text-muted-foreground text-[11px]">
            ${message.usage.cost.toFixed(4)}
          </span>
        )}
      </div>
      <div className="space-y-1">
        {message.content.map((block, i) => {
          if (block.type === "text") {
            return (
              <div key={i} className="text-sm leading-relaxed whitespace-pre-wrap">
                {block.text}
              </div>
            );
          }
          if (block.type === "thinking") {
            return <ThinkingBlock key={i} thinking={block.thinking || ""} />;
          }
          if (block.type === "toolCall") {
            const result = block.toolCallId ? toolResults.get(block.toolCallId) : undefined;
            return <ToolCallBlock key={i} block={block} result={result} />;
          }
          return null;
        })}
      </div>
      {message.usage && (
        <div className="text-muted-foreground mt-2 text-[11px]">
          {message.usage.input.toLocaleString()} in / {message.usage.output.toLocaleString()} out
          {message.usage.cacheRead > 0 && ` / ${message.usage.cacheRead.toLocaleString()} cached`}
        </div>
      )}
    </div>
  );
}

export function SessionMessages({ messages }: { messages: SessionMessage[] }) {
  const toolResults = new Map<string, ContentBlock>();
  for (const msg of messages) {
    if (msg.role === "toolResult" && msg.toolCallId) {
      toolResults.set(msg.toolCallId, msg.content[0]);
    }
  }

  const display = messages.filter((m) => m.role === "user" || m.role === "assistant");

  if (display.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">No messages in this session.</p>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      {display.map((msg) =>
        msg.role === "user" ? (
          <UserBubble key={msg.id} message={msg} />
        ) : (
          <AssistantBubble key={msg.id} message={msg} toolResults={toolResults} />
        ),
      )}
    </div>
  );
}

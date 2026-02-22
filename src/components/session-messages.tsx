"use client";

import { useState } from "react";
import type { SessionMessage, ContentBlock } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

function formatUserText(text: string): string {
  const tsMatch = text.match(
    /\[[A-Z][a-z]{2}\s\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}\s\w+\]\s*(.*)/s,
  );
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
      <CollapsibleTrigger className="text-xs text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1.5 py-0.5 hover:bg-accent rounded-sm px-2 -ml-2 w-full">
        <span className="text-[10px]">{open ? "▼" : "▶"}</span>
        <span className="italic">Thinking</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1 p-3 bg-muted/50 rounded-md text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed max-h-[400px] overflow-auto">
          {thinking}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function ToolCallBlock({
  block,
  result,
}: {
  block: ContentBlock;
  result?: ContentBlock;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="text-xs hover:text-foreground cursor-pointer flex items-center gap-1.5 py-1 w-full hover:bg-accent rounded-sm px-2 -ml-2">
        <span className="text-[10px]">{open ? "▼" : "▶"}</span>
        <Badge variant="outline" className="text-[11px] font-mono px-1.5 py-0">
          {block.toolName}
        </Badge>
        {result?.isError && (
          <Badge variant="destructive" className="text-[10px] px-1 py-0">
            error
          </Badge>
        )}
        {!open &&
          block.toolArguments &&
          Object.keys(block.toolArguments).length > 0 && (
            <span className="text-muted-foreground truncate font-mono">
              {JSON.stringify(block.toolArguments)}
            </span>
          )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1 p-3 bg-muted/50 rounded-md text-xs font-mono space-y-3">
          {block.toolArguments &&
            Object.keys(block.toolArguments).length > 0 && (
              <div>
                <div className="text-muted-foreground mb-1 text-[10px] uppercase tracking-wider">
                  Arguments
                </div>
                <pre className="whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify(block.toolArguments, null, 2)}
                </pre>
              </div>
            )}
          {result?.toolResultContent && (
            <div>
              <div className="text-muted-foreground mb-1 text-[10px] uppercase tracking-wider">
                Result
              </div>
              <pre className="whitespace-pre-wrap max-h-[300px] overflow-auto leading-relaxed">
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
      className={cn(
        "bg-blue-50 dark:bg-blue-950 rounded-md max-w-2xl px-4 self-end py-3",
        {
          "bg-purple-50 dark:bg-purple-950": isSystem,
        },
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-medium">
          {isSystem ? "System" : "User"}
        </span>
        <time className="text-[11px] text-muted-foreground dark:text-foreground">
          {format(message.timestamp, "MMM d, yyyy, h:mm a")}
        </time>
      </div>
      <div className="whitespace-pre-wrap text-sm leading-relaxed">
        {formatted}
      </div>
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
    <div className="border-l-2 border-muted-foreground/40 pl-4 py-2">
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <span className="text-xs font-medium">Assistant</span>
        {message.model && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {message.model}
          </Badge>
        )}
        <time className="text-[11px] text-muted-foreground">
          {format(message.timestamp, "MMM d, yyyy, h:mm a")}
        </time>
        {message.usage?.cost != null && (
          <span className="text-[11px] text-muted-foreground">
            ${message.usage.cost.toFixed(4)}
          </span>
        )}
      </div>
      <div className="space-y-1">
        {message.content.map((block, i) => {
          if (block.type === "text") {
            return (
              <div
                key={i}
                className="whitespace-pre-wrap text-sm leading-relaxed"
              >
                {block.text}
              </div>
            );
          }
          if (block.type === "thinking") {
            return <ThinkingBlock key={i} thinking={block.thinking || ""} />;
          }
          if (block.type === "toolCall") {
            const result = block.toolCallId
              ? toolResults.get(block.toolCallId)
              : undefined;
            return <ToolCallBlock key={i} block={block} result={result} />;
          }
          return null;
        })}
      </div>
      {message.usage && (
        <div className="mt-2 text-[11px] text-muted-foreground">
          {message.usage.input.toLocaleString()} in /{" "}
          {message.usage.output.toLocaleString()} out
          {message.usage.cacheRead > 0 &&
            ` / ${message.usage.cacheRead.toLocaleString()} cached`}
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

  const display = messages.filter(
    (m) => m.role === "user" || m.role === "assistant",
  );

  if (display.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-8 text-center">
        No messages in this session.
      </p>
    );
  }

  return (
    <div className="space-y-4 flex flex-col">
      {display.map((msg) =>
        msg.role === "user" ? (
          <UserBubble key={msg.id} message={msg} />
        ) : (
          <AssistantBubble
            key={msg.id}
            message={msg}
            toolResults={toolResults}
          />
        ),
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Container } from "@/components/ui/container";
import { Markdown } from "@/components/ui/markdown";
import { Badge } from "@/components/ui/badge";
import { FileTextIcon, FolderOpenIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type CoreFile = { name: string; content: string | null };

export function CoreFilesTab({
  files,
  workspace,
}: {
  files: CoreFile[];
  workspace?: string;
}) {
  const firstWithContent = files.find((f) => f.content !== null);
  const [selected, setSelected] = useState(
    firstWithContent?.name ?? files[0]?.name,
  );
  const activeFile = files.find((f) => f.name === selected);

  return (
    <Container className="pt-1">
      {workspace && (
        <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
          <FolderOpenIcon className="size-3.5 shrink-0" />
          <span className="font-mono truncate">{workspace}</span>
        </div>
      )}
      <div className="flex gap-3 items-start">
        {/* File list. */}
        <div className="w-48 shrink-0 space-y-1 border-l pl-2">
          {files.map((file) => (
            <button
              key={file.name}
              onClick={() => setSelected(file.name)}
              className={cn(
                "flex items-center gap-2 w-full rounded-md px-2.5 py-1.5 text-left text-sm transition-colors",
                selected === file.name
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <FileTextIcon className="size-3.5 shrink-0" />
              <span className="truncate">{file.name}</span>
              {file.content === null && (
                <Badge
                  variant="outline"
                  className="ml-auto text-[10px] px-1 py-0 shrink-0 opacity-50"
                >
                  --
                </Badge>
              )}
            </button>
          ))}
        </div>

        {/* File preview. */}
        <div className="flex-1 min-w-0 min-h-[500px]">
          {activeFile?.content !== null && activeFile?.content !== undefined ? (
            <Markdown>{activeFile.content}</Markdown>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center h-full">
              <div className="rounded-full bg-muted p-3">
                <FileTextIcon className="size-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">File not found</p>
                <p className="text-muted-foreground text-sm mt-0.5">
                  <span className="font-mono">{selected}</span> does not exist
                  in this workspace.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}

"use client";

import { useState } from "react";
import { Container } from "@/components/ui/container";
import { Markdown } from "@/components/ui/markdown";
import { Badge } from "@/components/ui/badge";
import { FileTextIcon, FolderOpenIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type CoreFile = { name: string; content: string | null };

export function CoreFilesTab({ files, workspace }: { files: CoreFile[]; workspace?: string }) {
  const firstWithContent = files.find((f) => f.content !== null);
  const [selected, setSelected] = useState(firstWithContent?.name ?? files[0]?.name);
  const activeFile = files.find((f) => f.name === selected);

  return (
    <Container className="pt-1">
      {workspace && (
        <div className="text-muted-foreground mb-3 flex items-center gap-2 text-xs">
          <FolderOpenIcon className="size-3.5 shrink-0" />
          <span className="truncate font-mono">{workspace}</span>
        </div>
      )}
      <div className="flex items-start gap-3">
        {/* File list. */}
        <div className="w-48 shrink-0 space-y-1 border-l pl-2">
          {files.map((file) => (
            <button
              key={file.name}
              onClick={() => setSelected(file.name)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors",
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
                  className="ml-auto shrink-0 px-1 py-0 text-[10px] opacity-50"
                >
                  --
                </Badge>
              )}
            </button>
          ))}
        </div>

        {/* File preview. */}
        <div className="min-h-[500px] min-w-0 flex-1">
          {activeFile?.content !== null && activeFile?.content !== undefined ? (
            <Markdown>{activeFile.content}</Markdown>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
              <div className="bg-muted rounded-full p-3">
                <FileTextIcon className="text-muted-foreground size-6" />
              </div>
              <div>
                <p className="text-sm font-medium">File not found</p>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  <span className="font-mono">{selected}</span> does not exist in this workspace.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}

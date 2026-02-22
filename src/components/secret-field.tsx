"use client";

import { useState } from "react";
import { EyeIcon, EyeOffIcon, CopyIcon, CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function SecretField({ value, className }: { value: string; className?: string }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="font-mono text-xs select-all">
        {visible ? value : "•".repeat(Math.min(value.length, 32))}
      </span>
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        aria-label={visible ? "Hide" : "Reveal"}
      >
        {visible ? <EyeOffIcon className="size-3.5" /> : <EyeIcon className="size-3.5" />}
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        aria-label="Copy"
      >
        {copied ? (
          <CheckIcon className="size-3.5 text-green-500" />
        ) : (
          <CopyIcon className="size-3.5" />
        )}
      </button>
    </span>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function UsagePageClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 30_000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="relative">
      <div className="bg-background text-muted-foreground absolute top-0 right-0 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-green-500" />
        </span>
        Live
      </div>
      {children}
    </div>
  );
}

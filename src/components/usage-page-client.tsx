"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { DEFAULT_USAGE_REFRESH_INTERVAL, STORAGE_KEYS } from "@/lib/constants";

export function UsagePageClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [refreshInterval] = useLocalStorage(
    STORAGE_KEYS.USAGE_REFRESH_INTERVAL,
    DEFAULT_USAGE_REFRESH_INTERVAL,
  );

  useEffect(() => {
    const id = setInterval(() => router.refresh(), refreshInterval);
    return () => clearInterval(id);
  }, [router, refreshInterval]);

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

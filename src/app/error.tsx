"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

type RootErrorProps = {
  error: Error & { digest?: string };
};

const REDACTED_SERVER_ERROR_MESSAGE =
  "An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details.";

function truncate(value: string, max = 400): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3)}...`;
}

export default function RootError({ error }: RootErrorProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/error") return;

    const details =
      !error.message || error.message === REDACTED_SERVER_ERROR_MESSAGE
        ? error.digest || "Unexpected server error"
        : error.message;

    const params = new URLSearchParams({
      message: "This page could not be loaded because the server encountered an unexpected error.",
      details: truncate(details),
      context: `rendering '${pathname}'`,
      retry: pathname || "/",
    });

    router.replace(`/error?${params.toString()}`);
  }, [error.digest, error.message, pathname, router]);

  return null;
}

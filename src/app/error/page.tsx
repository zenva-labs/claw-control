import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangleIcon } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Error | Claw Control" };
export const dynamic = "force-dynamic";

type ErrorSearchParams = Promise<{
  message?: string;
  details?: string;
  context?: string;
  retry?: string;
  variant?: string;
}>;

function getText(value: string | undefined, fallback: string): string {
  const normalized = value?.trim();
  return normalized ? normalized : fallback;
}

function getRetryPath(value: string | undefined): string {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function extractOpenClawConfigPath(details: string): string | undefined {
  const singleQuotedPath = details.match(/open '([^']*openclaw\.json)'/i);
  if (singleQuotedPath?.[1]) return singleQuotedPath[1];

  const doubleQuotedPath = details.match(/open "([^"]*openclaw\.json)"/i);
  if (doubleQuotedPath?.[1]) return doubleQuotedPath[1];

  return undefined;
}

function MissingOpenClawConfigState({
  details,
  retryPath,
}: {
  details: string;
  retryPath: string;
}) {
  const configPath = extractOpenClawConfigPath(details);

  return (
    <Container className="max-w-3xl">
      <div className="py-8">
        <section className="via-background to-background relative overflow-hidden rounded-3xl border bg-linear-to-br from-amber-50 p-6 shadow-sm sm:p-8">
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-amber-200/35 blur-3xl" />

          <div className="relative space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-amber-100 text-amber-700">
                <AlertTriangleIcon className="size-7" />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-amber-700">OpenClaw config not found</p>
                <h1 className="text-3xl font-semibold tracking-tight text-balance">
                  Is your OpenClaw instance running?
                </h1>
                <p className="text-muted-foreground max-w-2xl text-sm leading-6">
                  Claw Control could not find{" "}
                  <span className="text-foreground font-mono">openclaw.json</span>, so there is no
                  OpenClaw state available for this page yet.
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="bg-background/90 rounded-2xl border p-4">
                <p className="text-sm font-medium">Start OpenClaw</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Launch your OpenClaw instance so it can write its config and runtime files.
                </p>
              </div>
              <div className="bg-background/90 rounded-2xl border p-4">
                <p className="text-sm font-medium">Check the OpenClaw home</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Make sure Claw Control is reading from the same OpenClaw directory you expect.
                </p>
              </div>
              <div className="bg-background/90 rounded-2xl border p-4">
                <p className="text-sm font-medium">Reload the page</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Once the file exists, retry and this page should load normally.
                </p>
              </div>
            </div>

            <div className="bg-background/90 rounded-2xl border p-4">
              <p className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
                Expected File
              </p>
              <p className="mt-2 font-mono text-xs break-all">{configPath ?? "openclaw.json"}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild size="lg">
                <Link href={retryPath}>Try Again</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/">Go to Dashboard</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </Container>
  );
}

export default async function ServerErrorPage({
  searchParams,
}: {
  searchParams: ErrorSearchParams;
}) {
  const params = await searchParams;
  const details = getText(params.details, "No additional details were provided.");
  const retryPath = getRetryPath(params.retry);
  const variant = params.variant?.trim();

  if (variant === "missing-openclaw-config") {
    return <MissingOpenClawConfigState details={details} retryPath={retryPath} />;
  }

  const message = getText(
    params.message,
    "The page could not be loaded because the server encountered an error.",
  );
  const context = getText(params.context, "loading this page");

  return (
    <Container className="max-w-2xl">
      <div className="space-y-4 py-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Unable to Load Page</h1>
          <p className="text-muted-foreground text-sm">
            We hit a server-side error while preparing this page.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="size-4 text-amber-500" />
              Server Error
            </CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-medium">What was happening</p>
              <p className="text-muted-foreground mt-1">{context}</p>
            </div>
            <div>
              <p className="font-medium">Technical details</p>
              <p className="text-muted-foreground mt-1 font-mono text-xs break-all">{details}</p>
            </div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button asChild>
              <Link href={retryPath}>Try Again</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Go to Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Container>
  );
}

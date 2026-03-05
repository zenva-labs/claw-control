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

export default async function ServerErrorPage({
  searchParams,
}: {
  searchParams: ErrorSearchParams;
}) {
  const params = await searchParams;
  const message = getText(
    params.message,
    "The page could not be loaded because the server encountered an error.",
  );
  const details = getText(params.details, "No additional details were provided.");
  const context = getText(params.context, "loading this page");
  const retryPath = getRetryPath(params.retry);

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

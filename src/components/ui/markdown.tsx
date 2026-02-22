import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function Markdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent
        className={cn(
          "prose prose-sm dark:prose-invert max-w-none",
          "prose-headings:font-semibold prose-headings:tracking-tight prose-headings:my-2",
          "prose-pre:bg-muted prose-pre:text-foreground",
          "prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none",
          "prose-hr:my-6",
        )}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
      </CardContent>
    </Card>
  );
}

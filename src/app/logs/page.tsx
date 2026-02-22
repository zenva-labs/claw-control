import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { LogsPageClient } from "@/components/logs-page-client";

export const metadata: Metadata = { title: "Logs | Claw Control" };

export default function LogsPage() {
  return (
    <Container fullWidth>
      <PageBreadcrumb page="Logs" />
      <LogsPageClient />
    </Container>
  );
}

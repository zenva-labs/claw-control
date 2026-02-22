import { Container } from "@/components/ui/container";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import AppSettings from "@/components/app-settings";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings | Claw Control" };

export default function SettingsPage() {
  return (
    <Container>
      <PageBreadcrumb page="Settings" />
      <AppSettings />
    </Container>
  );
}

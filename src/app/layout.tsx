import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "@/components/app-sidebar";
import { BreadcrumbProvider, BreadcrumbSlot } from "@/components/breadcrumb-provider";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { GatewayHealthBadge } from "@/components/gateway-health-badge";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Claw Control",
  description: "Mission Control panel for OpenClaw",
};

const darkModeScript = `(function(){
  var d=document.documentElement;
  var saved=localStorage.getItem('theme');
  if(saved==='dark'){
    d.classList.add('dark');
  } else if(saved==='light'){
    d.classList.remove('dark');
  } else {
    var m=window.matchMedia('(prefers-color-scheme:dark)');
    if(m.matches)d.classList.add('dark');
    m.addEventListener('change',function(e){
      if(!localStorage.getItem('theme')||localStorage.getItem('theme')==='system'){
        d.classList.toggle('dark',e.matches);
      }
    });
  }
})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: darkModeScript }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <BreadcrumbProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 !h-4" />
                <BreadcrumbSlot />
                <div className="ml-auto">
                  <GatewayHealthBadge />
                </div>
              </header>
              <main className="flex-1 py-4">{children}</main>
            </SidebarInset>
          </SidebarProvider>
        </BreadcrumbProvider>
      </body>
    </html>
  );
}

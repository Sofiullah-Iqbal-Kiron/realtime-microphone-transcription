"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/app-sidebar";
import { useAccessToken } from "@/lib/store";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const accessToken = useAccessToken();
  const router = useRouter();

  useEffect(() => {
    if (!accessToken) {
      router.replace("/signin");
    }
  }, [accessToken, router]);

  if (!accessToken) return null;

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 !h-4" />
            <span className="text-sm font-medium text-muted-foreground">
              Real-Time Transcription
            </span>
          </header>
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

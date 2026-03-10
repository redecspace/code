import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/common/app-sidebar";
import TextLogo from "./text-logo";
import { SearchBar } from "./search-bar";
import { Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 z-40 sticky top-0 flex w-full items-center gap-4 justify-between border-b px-4 bg-card/80 backdrop-blur-md">
            <div className="md:hidden flex items-center gap-2 ">
              <SidebarTrigger className="md:hidden" />
              <div className="md:sr-only text-sidebar-foreground">
                <TextLogo />
              </div>
            </div>
            
            <div className="w-full flex items-center md:max-w-sm mr-auto">
              <SearchBar />
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" asChild className="rounded-full">
                <Link href="/settings">
                  <Settings className="h-[1.2rem] w-[1.2rem]" />
                </Link>
              </Button>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

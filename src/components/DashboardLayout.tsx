import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import { isNavItemActive, navItems } from "@/components/nav-items";
import BottomNav from "./BottomNav";
import { PanelLeft } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const isMobile = useIsMobile();

  return (
    <>
      <div className="hidden md:block">
        <Sidebar collapsible="icon" className="border-r border-sidebar-border">
          <SidebarHeader className="h-16 justify-center border-b border-sidebar-border">
            <div className="flex items-center gap-3 px-2 w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-black/5 rounded-lg transition-colors shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-sidebar-foreground/70" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold tracking-tight text-foreground truncate">
                    Preservation App
                  </span>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-2">
              {navItems.map(item => {
                const isActive = isNavItemActive(location, item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className="h-10 font-normal data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-medium"
                    >
                      <Link href={item.path}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-sidebar-border">
            <p className="text-[11px] text-sidebar-foreground/60 px-2 group-data-[collapsible=icon]:hidden">
              MODEC · Internal use
            </p>
          </SidebarFooter>
        </Sidebar>
      </div>

      <SidebarInset>
        <main className={`flex-1 p-6 md:p-8 ${isMobile ? "pb-20" : ""}`}>{children}</main>
        {isMobile && <BottomNav />}
      </SidebarInset>
    </>
  );
}

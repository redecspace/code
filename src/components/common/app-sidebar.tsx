"use client";

import { Home, Info, Mail, ShieldCheck, FileText } from "lucide-react";
import { usePathname } from "next/navigation";
import { NavLink } from "./nav-link";
import Image from "next/image";
import { tools } from "@/data/tools";
import { SVGIcon } from "@/components/common/svg-icon";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import TextLogo from "./text-logo";
import { cn } from "@/lib/utils";
import { WEB_DOMAIN } from "@/data/constants";

export function AppSidebar() {
  const { state, setOpenMobile, isMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const infoLinks = [
    { title: "About", url: "/about", icon: Info },
    { title: "Contact", url: "/contact", icon: Mail },
    { title: "Privacy Policy", url: "/privacy", icon: ShieldCheck },
    { title: "Terms of Service", url: "/terms", icon: FileText },
  ];

  return (
    <Sidebar collapsible="offcanvas" className="h-full">
      <SidebarHeader className="h-14 border-b flex items-start px-4">
        <div className="flex my-auto  items-center justify-center gap-3">
          <Image
            src="/logo.png"
            alt="Redec Logo"
            width={30}
            height={30}
            fetchPriority="high"
            priority
            loading={"eager"}
            className="rounded"
          />
          <TextLogo />
        </div>
      </SidebarHeader>
      <SidebarContent className="py-2 scrollbar-hide h-full">
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className=" rounded"
                asChild
                isActive={isActive("/")}
                onClick={handleLinkClick}
              >
                <NavLink
                  href="/"
                  end
                  className="hover:bg-sidebar-accent/50"
                  activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                >
                  <Home className="mr-2 h-4 w-4" />
                  {!collapsed && <span>Home</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {tools.map((group) => (
          <SidebarGroup key={group.category} className="-mt-5">
            <SidebarGroupLabel>{group.category}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      className="rounded"
                      asChild
                      isActive={isActive(item.url)}
                      onClick={handleLinkClick}
                    >
                      <NavLink
                        href={item.url}
                        end
                        className="hover:bg-sidebar-accent/50 group/nav-item"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                      >
                        <SVGIcon
                          src={item.icon}
                          className={cn(
                            "mr-2 h-4 w-4 transition-all bg-foreground/70 nav",
                            isActive(item.url)
                              ? "bg-primary"
                              : "group-hover/nav-item:bg-foreground",
                          )}
                        />

                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        <SidebarGroup className="-mt-5">
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {infoLinks.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    className="rounded"
                    asChild
                    isActive={isActive(item.url)}
                    onClick={handleLinkClick}
                  >
                    <NavLink
                      href={item.url}
                      end
                      className="hover:bg-sidebar-accent/50 group/nav-item"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                    >
                      <item.icon
                        className={cn(
                          "mr-2 h-4 w-4 transition-all text-foreground/70",
                          isActive(item.url)
                            ? "text-primary"
                            : "group-hover/nav-item:text-foreground",
                        )}
                      />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      <SidebarFooter className="border-t px-4">
        {!collapsed ? (
          <div className="flex flex-col gap-1">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              &copy; {new Date().getFullYear()} {WEB_DOMAIN}
            </p>
            <p className="text-[9px] text-muted-foreground/60 leading-tight">
              All rights reserved.
            </p>
          </div>
        ) : (
          <div className="flex justify-center">
            <p className="text-[10px] text-muted-foreground font-bold">&copy;</p>
          </div>
        )}
      </SidebarFooter>
      </SidebarContent>

    </Sidebar>
  );
}

import {
  IconChevronRight,
  IconCube,
  IconLayoutDashboard,
  IconMailOpened,
  IconTimeline,
  IconUsers,
} from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { usePendingInvitations } from "@/hooks/queries/invitation/use-pending-invitations";
import useActiveWorkspace from "@/hooks/queries/workspace/use-active-workspace";
import { cn } from "@/lib/cn";

export function NavMain() {
  const { t } = useTranslation();
  const { data: workspace } = useActiveWorkspace();
  const navigate = useNavigate();
  const { data: invitations = [] } = usePendingInvitations();

  if (!workspace) return null;

  const pendingCount = invitations.length;

  const navItems = [
    {
      title: t("navigation:sidebar.activityFeed"),
      url: `/dashboard/workspace/${workspace.id}/activity`,
      isActive:
        window.location.pathname ===
        `/dashboard/workspace/${workspace.id}/activity`,
      badge: null,
      icon: IconTimeline,
    },
    {
      title: t("navigation:sidebar.projects"),
      url: `/dashboard/workspace/${workspace.id}`,
      isActive:
        window.location.pathname === `/dashboard/workspace/${workspace.id}`,
      badge: null,
      icon: IconCube,
    },
    {
      title: t("navigation:sidebar.members"),
      url: `/dashboard/workspace/${workspace.id}/members`,
      isActive:
        window.location.pathname ===
        `/dashboard/workspace/${workspace.id}/members`,
      badge: null,
      icon: IconUsers,
    },
    {
      title: t("navigation:sidebar.invitations"),
      url: "/dashboard/invitations",
      isActive: window.location.pathname === "/dashboard/invitations",
      badge: pendingCount > 0 ? pendingCount : null,
      icon: IconMailOpened,
    },
  ];

  return (
    <Collapsible defaultOpen className="group/collapsible">
      <SidebarGroup className="gap-1 p-2">
        <CollapsibleTrigger
          className="data-panel-open:[&_svg]:rotate-90"
          render={
            <SidebarGroupLabel className="h-7 cursor-pointer justify-between px-0 text-sidebar-accent-foreground" />
          }
        >
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <IconLayoutDashboard
              aria-hidden
              className="size-3.5 shrink-0 text-sidebar-foreground/55"
              stroke={1.5}
            />
            <span className="truncate">{t("navigation:sidebar.overview")}</span>
          </span>
          <IconChevronRight
            aria-hidden
            className="size-3.5 shrink-0 text-sidebar-foreground/60 transition-transform duration-200"
            stroke={1.5}
          />
        </CollapsibleTrigger>
        <CollapsiblePanel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {navItems.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={item.isActive}
                      size="default"
                      className="h-8 gap-2.5 ps-2.5 text-sm hover:bg-transparent hover:text-sidebar-accent-foreground active:bg-transparent"
                      onClick={() => navigate({ to: item.url })}
                    >
                      <ItemIcon
                        aria-hidden
                        size={16}
                        stroke={1.5}
                        className={cn(
                          "shrink-0 text-sidebar-foreground/55",
                          item.isActive && "text-sidebar-accent-foreground",
                        )}
                      />
                      <span>{item.title}</span>
                      {item.badge !== null && (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-sm border border-sidebar-border/60 px-1 text-[11px] font-medium text-sidebar-foreground/80">
                          {item.badge}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsiblePanel>
      </SidebarGroup>
    </Collapsible>
  );
}

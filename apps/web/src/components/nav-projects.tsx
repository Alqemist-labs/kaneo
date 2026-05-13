import {
  IconChevronRight,
  IconDots,
  IconFolder,
  IconLayoutKanban,
  IconLink,
  IconPlus,
  IconSettings,
  IconTrash,
} from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import icons from "@/constants/project-icons";
import useDeleteProject from "@/hooks/mutations/project/use-delete-project";
import useGetProjects from "@/hooks/queries/project/use-get-projects";
import useActiveWorkspace from "@/hooks/queries/workspace/use-active-workspace";
import { cn } from "@/lib/cn";
import { toast } from "@/lib/toast";
import type { ProjectWithTasks } from "@/types/project";
import CreateProjectModal from "./shared/modals/create-project-modal";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";

export function NavProjects() {
  const { t } = useTranslation();
  const { isMobile } = useSidebar();
  const { data: workspace } = useActiveWorkspace();
  const { data: projects } = useGetProjects({
    workspaceId: workspace?.id || "",
  });
  const queryClient = useQueryClient();
  const { mutateAsync: deleteProject } = useDeleteProject();
  const navigate = useNavigate();
  const { workspaceId: currentWorkspaceId, projectId: currentProjectId } =
    useParams({
      strict: false,
    });

  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] =
    useState(false);
  const [isDeleteProjectModalOpen, setIsDeleteProjectModalOpen] =
    useState(false);
  const [projectToDeleteId, setProjectToDeleteID] = useState<string | null>(
    null,
  );

  const isCurrentProject = (projectId: string) => {
    return (
      currentProjectId === projectId && currentWorkspaceId === workspace?.id
    );
  };

  const handleProjectClick = (project: ProjectWithTasks) => {
    navigate({
      to: "/dashboard/workspace/$workspaceId/project/$projectId/board",
      params: {
        workspaceId: workspace?.id || "",
        projectId: project.id,
      },
    });
  };

  if (!workspace) return null;

  return (
    <>
      <Collapsible defaultOpen className="group/collapsible">
        <SidebarGroup className="group-data-[collapsible=icon]:hidden gap-1 p-2 pt-1">
          <CollapsibleTrigger
            className="data-panel-open:[&_svg]:rotate-90"
            render={
              <SidebarGroupLabel className="h-7 cursor-pointer justify-between gap-2 px-0 text-sidebar-accent-foreground" />
            }
          >
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <IconLayoutKanban
                aria-hidden
                className="size-3.5 shrink-0 text-sidebar-foreground/55"
                stroke={1.5}
              />
              <span className="truncate">
                {t("navigation:sidebar.projects")}
              </span>
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
                {projects?.map((project) => {
                  const ProjectIcon =
                    icons[project.icon as keyof typeof icons] ?? icons.Layout;
                  return (
                    <SidebarMenuItem key={project.id}>
                      <SidebarMenuButton
                        isActive={isCurrentProject(project.id)}
                        size="default"
                        className="h-8 gap-2.5 ps-2.5 text-sm hover:bg-transparent hover:text-sidebar-accent-foreground active:bg-transparent"
                        onClick={() => handleProjectClick(project)}
                      >
                        <ProjectIcon
                          aria-hidden
                          className={cn(
                            "size-4 shrink-0 text-sidebar-foreground/55",
                            isCurrentProject(project.id) &&
                              "text-sidebar-accent-foreground",
                          )}
                          strokeWidth={1.5}
                        />
                        <span>{project.name}</span>
                      </SidebarMenuButton>

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <button
                              type="button"
                              className="absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-lg p-0 text-sidebar-foreground outline-hidden ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground after:-inset-2 after:absolute md:after:hidden peer-data-[size=sm]/menu-button:top-1 peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 group-data-[collapsible=icon]:hidden group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0"
                            />
                          }
                        >
                          <IconDots
                            aria-hidden
                            size={16}
                            stroke={1.5}
                            className="text-sidebar-foreground/80"
                          />
                          <span className="sr-only">
                            {t("navigation:sidebar.more")}
                          </span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          className="w-44 rounded-lg"
                          side={isMobile ? "bottom" : "right"}
                          align={isMobile ? "end" : "start"}
                        >
                          <DropdownMenuItem
                            className="h-7 items-start cursor-pointer text-sm"
                            onClick={() => handleProjectClick(project)}
                          >
                            <IconFolder
                              aria-hidden
                              size={16}
                              stroke={1.5}
                              className="text-muted-foreground"
                            />
                            <span>
                              {t("navigation:projectList.viewProject")}
                            </span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="h-7 items-start cursor-pointer text-sm"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `${window.location.origin}/dashboard/workspace/${workspace?.id}/project/${project.id}`,
                              );
                              toast.success(
                                t("navigation:projectList.linkCopied"),
                              );
                            }}
                          >
                            <IconLink
                              aria-hidden
                              size={16}
                              stroke={1.5}
                              className="text-muted-foreground"
                            />
                            <span>
                              {t("navigation:projectList.shareProject")}
                            </span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="h-7 items-start cursor-pointer text-sm"
                            onClick={() => {
                              navigate({
                                to: "/dashboard/settings/projects/$projectId/general",
                                params: { projectId: project.id },
                              });
                            }}
                          >
                            <IconSettings
                              aria-hidden
                              size={16}
                              stroke={1.5}
                              className="text-muted-foreground"
                            />
                            <span>
                              {t("navigation:projectList.projectSettings")}
                            </span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="h-7 items-start text-destructive cursor-pointer text-sm"
                            onClick={() => {
                              setProjectToDeleteID(project.id);
                              setIsDeleteProjectModalOpen(true);
                            }}
                          >
                            <IconTrash
                              aria-hidden
                              size={16}
                              stroke={1.5}
                              className="text-destructive"
                            />
                            <span>
                              {t("navigation:projectList.deleteProject")}
                            </span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  );
                })}

                <SidebarMenuItem className="mt-1">
                  <SidebarMenuButton
                    size="default"
                    className="h-8 gap-2.5 ps-2.5 text-sm hover:bg-transparent hover:text-sidebar-accent-foreground active:bg-transparent"
                    onClick={() => setIsCreateProjectModalOpen(true)}
                  >
                    <IconPlus
                      aria-hidden
                      size={16}
                      stroke={1.5}
                      className="shrink-0 text-sidebar-foreground/55"
                    />
                    <span>{t("navigation:projectList.addProject")}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsiblePanel>
        </SidebarGroup>
      </Collapsible>

      <CreateProjectModal
        open={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
      />

      <AlertDialog
        open={isDeleteProjectModalOpen}
        onOpenChange={setIsDeleteProjectModalOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("navigation:projectList.deleteConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("navigation:projectList.deleteConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose>
              <Button variant="outline" size="sm">
                {t("common:actions.cancel")}
              </Button>
            </AlertDialogClose>
            <AlertDialogClose
              onClick={async () => {
                await deleteProject({
                  id: projectToDeleteId || "",
                });
                toast.success(t("navigation:projectList.deletedToast"));
                queryClient.invalidateQueries({
                  queryKey: ["projects"],
                });
                navigate({
                  to: "/dashboard/workspace/$workspaceId",
                  params: {
                    workspaceId: workspace?.id || "",
                  },
                });
              }}
            >
              <Button variant="destructive" size="sm">
                {t("navigation:projectList.deleteProject")}
              </Button>
            </AlertDialogClose>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

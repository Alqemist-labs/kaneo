import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import WorkspaceLayout from "@/components/common/workspace-layout";
import PageTitle from "@/components/page-title";
import { WorkspaceActivityFeed } from "@/components/workspace/workspace-activity-feed";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/activity",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const { workspaceId } = Route.useParams();

  return (
    <>
      <PageTitle title={t("activity:workspaceFeed.pageTitle")} />
      <WorkspaceLayout title={t("activity:workspaceFeed.pageTitle")}>
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 py-2">
          <header className="space-y-2">
            <h1 className="font-semibold text-2xl">
              {t("activity:workspaceFeed.pageTitle")}
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("activity:workspaceFeed.description")}
            </p>
          </header>

          <section className="flex flex-col gap-4">
            <div className="space-y-1">
              <h2 className="font-medium text-md">
                {t("activity:workspaceFeed.recentTitle")}
              </h2>
              <p className="text-muted-foreground text-xs">
                {t("activity:workspaceFeed.recentSubtitle")}
              </p>
            </div>
            <WorkspaceActivityFeed workspaceId={workspaceId} />
          </section>
        </div>
      </WorkspaceLayout>
    </>
  );
}

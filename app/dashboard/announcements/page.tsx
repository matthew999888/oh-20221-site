export const dynamic = "force-dynamic";

import { requirePagePermission, canEdit } from "@/lib/permissions";
import { getContentBlock } from "@/lib/content-blocks";
import ContentBlockSection from "@/components/dashboard/ContentBlockSection";

export default async function DashboardAnnouncementsPage() {
  const session = await requirePagePermission("announcements", "view");
  const block = await getContentBlock("announcements", {
    title: "Announcements",
    description: "Unit-wide notices and updates. Editors can add, reorder, and remove sections below."
  });
  const editable = canEdit(session.user.roles, "announcements");

  return (
    <div className="dash-page">
      <ContentBlockSection
        page="announcements"
        path="/dashboard/announcements"
        contentBlockId={block.id}
        initialTitle={block.title}
        initialDescription={block.description ?? ""}
        initialBoxes={block.boxes}
        canEdit={editable}
      />
    </div>
  );
}

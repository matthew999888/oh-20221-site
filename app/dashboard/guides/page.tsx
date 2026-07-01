export const dynamic = "force-dynamic";

import { requirePagePermission, canEdit } from "@/lib/permissions";
import { getContentBlock } from "@/lib/content-blocks";
import ContentBlockSection from "@/components/dashboard/ContentBlockSection";

export default async function GuidesPage() {
  const session = await requirePagePermission("guide-links", "view");
  const block = await getContentBlock("guide-links", {
    title: "Guides",
    description: "Reference guides and resources for cadets and staff."
  });
  const editable = canEdit(session.user.roles, "guide-links");

  return (
    <div className="dash-page">
      <ContentBlockSection
        page="guide-links"
        path="/dashboard/guides"
        contentBlockId={block.id}
        initialTitle={block.title}
        initialDescription={block.description ?? ""}
        initialBoxes={block.boxes}
        canEdit={editable}
      />
    </div>
  );
}

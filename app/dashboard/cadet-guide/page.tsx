export const dynamic = "force-dynamic";

import { requirePagePermission, canEdit } from "@/lib/permissions";
import { getContentBlock } from "@/lib/content-blocks";
import ContentBlockSection from "@/components/dashboard/ContentBlockSection";

export default async function CadetGuidePage() {
  const session = await requirePagePermission("cadet-guide", "view");
  const block = await getContentBlock("cadet-guide", {
    title: "Cadet Guide",
    description: "Expectations, uniform standards, and day-to-day guidance for cadets."
  });
  const editable = canEdit(session.user.roles, "cadet-guide");

  return (
    <div className="dash-page">
      <ContentBlockSection
        page="cadet-guide"
        path="/dashboard/cadet-guide"
        contentBlockId={block.id}
        initialTitle={block.title}
        initialDescription={block.description ?? ""}
        initialBoxes={block.boxes}
        canEdit={editable}
      />
    </div>
  );
}

export const dynamic = "force-dynamic";

import { requirePagePermission, canEdit } from "@/lib/permissions";
import { getContentBlock } from "@/lib/content-blocks";
import ContentBlockSection from "@/components/dashboard/ContentBlockSection";

export default async function OpsOrderPage() {
  const session = await requirePagePermission("ops-order", "view");
  const block = await getContentBlock("ops-order", {
    title: "Ops Order",
    description: "Operations order for the current training period — mission, timeline, and tasking."
  });
  const editable = canEdit(session.user.roles, "ops-order");

  return (
    <div className="dash-page">
      <ContentBlockSection
        page="ops-order"
        path="/dashboard/ops-order"
        contentBlockId={block.id}
        initialTitle={block.title}
        initialDescription={block.description ?? ""}
        initialBoxes={block.boxes}
        canEdit={editable}
      />
    </div>
  );
}

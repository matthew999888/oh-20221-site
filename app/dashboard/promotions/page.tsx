export const dynamic = "force-dynamic";

import { requirePagePermission, canEdit } from "@/lib/permissions";
import { getContentBlock } from "@/lib/content-blocks";
import ContentBlockSection from "@/components/dashboard/ContentBlockSection";

export default async function PromotionsPage() {
  const session = await requirePagePermission("promotions", "view");
  const block = await getContentBlock("promotions", {
    title: "Promotions",
    description: "Promotion criteria, boards, and the current cycle's results."
  });
  const editable = canEdit(session.user.roles, "promotions");

  return (
    <div className="dash-page">
      <ContentBlockSection
        page="promotions"
        path="/dashboard/promotions"
        contentBlockId={block.id}
        initialTitle={block.title}
        initialDescription={block.description ?? ""}
        initialBoxes={block.boxes}
        canEdit={editable}
      />
    </div>
  );
}

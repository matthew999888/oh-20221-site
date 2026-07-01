export const dynamic = "force-dynamic";

import { requirePagePermission } from "@/lib/permissions";
import InspectionForm from "./InspectionForm";

export default async function InspectionPage() {
  await requirePagePermission("ig-inspection", "edit");
  return <InspectionForm />;
}

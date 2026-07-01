export const dynamic = "force-dynamic";

import { requirePagePermission } from "@/lib/permissions";
import Form341 from "./Form341";

export default async function Superintendent341Page() {
  await requirePagePermission("superintendent-341", "edit");
  return <Form341 />;
}

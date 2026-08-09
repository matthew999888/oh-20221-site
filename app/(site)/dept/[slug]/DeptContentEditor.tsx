"use client";

import OrgContentBlockSection from "@/components/shared/OrgContentBlockSection";
import {
  createDeptContentBox,
  deleteDeptContentBox,
  reorderDeptContentBoxes,
  updateDeptContentBox,
  updateDeptContentMeta
} from "./_actions";

type Box = { id: string; title: string; body: string; order: number };

export default function DeptContentEditor({
  deptSlug,
  contentBlockId,
  initialTitle,
  initialDescription,
  initialBoxes,
  canEdit
}: {
  deptSlug: string;
  contentBlockId: string;
  initialTitle: string;
  initialDescription: string;
  initialBoxes: Box[];
  canEdit: boolean;
}) {
  return (
    <OrgContentBlockSection
      canEdit={canEdit}
      contentBlockId={contentBlockId}
      initialTitle={initialTitle}
      initialDescription={initialDescription}
      initialBoxes={initialBoxes}
      actions={{
        updateMeta: (id, data) => updateDeptContentMeta(deptSlug, id, data),
        createBox: (id) => createDeptContentBox(deptSlug, id),
        updateBox: (id, data) => updateDeptContentBox(deptSlug, id, data),
        deleteBox: (id) => deleteDeptContentBox(deptSlug, id),
        reorderBoxes: (ids) => reorderDeptContentBoxes(deptSlug, ids)
      }}
    />
  );
}

"use client";

import OrgContentBlockSection from "@/components/shared/OrgContentBlockSection";
import {
  createLdrContentBox,
  deleteLdrContentBox,
  reorderLdrContentBoxes,
  updateLdrContentBox,
  updateLdrContentMeta
} from "./_actions";

type Box = { id: string; title: string; body: string; order: number };

export default function LdrContentEditor({
  ldrSlug,
  contentBlockId,
  initialTitle,
  initialDescription,
  initialBoxes,
  canEdit
}: {
  ldrSlug: string;
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
        updateMeta: (id, data) => updateLdrContentMeta(ldrSlug, id, data),
        createBox: (id) => createLdrContentBox(ldrSlug, id),
        updateBox: (id, data) => updateLdrContentBox(ldrSlug, id, data),
        deleteBox: (id) => deleteLdrContentBox(ldrSlug, id),
        reorderBoxes: (ids) => reorderLdrContentBoxes(ldrSlug, ids)
      }}
    />
  );
}

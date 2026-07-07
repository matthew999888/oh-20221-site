export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditLdr } from "@/lib/permissions";
import { getLdrRole, getOrCreateLdrReactionOptions } from "@/lib/org";
import LdrContentEditor from "./LdrContentEditor";
import AnnouncementList, { type LdrAnnouncement } from "./AnnouncementList";
import GuideLinkList from "./GuideLinkList";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const role = await getLdrRole(params.slug);
  return {
    title: role.name,
    description: `News, resources, and info for ${role.name} — OH-20221 AFJROTC.`
  };
}

export default async function LdrPage({ params }: { params: { slug: string } }) {
  const role = await getLdrRole(params.slug);
  const session = await getServerSession(authOptions);
  const roleSlugs = session?.user.roles ?? [];
  const userId = session?.user.id;
  const editable = canEditLdr(roleSlugs, role.slug);
  const canReact = Boolean(session && session.user.status === "approved" && roleSlugs.length > 0);

  const key = `ldr:${role.slug}`;

  const [block, announcements, guideLinks, reactionOptions] = await Promise.all([
    prisma.contentBlock
      .findUnique({ where: { key }, include: { boxes: { orderBy: { order: "asc" } } } })
      .then(
        (existing) =>
          existing ??
          prisma.contentBlock.create({
            data: { key, title: role.name, description: `News, resources, and info for ${role.name}.` },
            include: { boxes: { orderBy: { order: "asc" } } }
          })
      ),
    prisma.announcement.findMany({
      where: { ldrSlug: role.slug },
      orderBy: [{ pinned: "desc" }, { publishAt: "desc" }]
    }),
    prisma.guideLink.findMany({ where: { ldrSlug: role.slug }, orderBy: { order: "asc" } }),
    getOrCreateLdrReactionOptions(role.slug)
  ]);

  const announcementIds = announcements.map((a) => a.id);
  const votes = announcementIds.length
    ? await prisma.reactionVote.findMany({
        where: { targetType: "Announcement", targetId: { in: announcementIds } }
      })
    : [];

  const announcementsWithReactions: LdrAnnouncement[] = announcements.map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    pinned: a.pinned,
    eventAt: a.eventAt ? a.eventAt.toISOString() : null,
    publishAt: a.publishAt.toISOString(),
    reactions: reactionOptions.map((o) => {
      const votesForOption = votes.filter((v) => v.targetId === a.id && v.reactionOptionId === o.id);
      return {
        optionId: o.id,
        emoji: o.emoji,
        label: o.label,
        count: votesForOption.length,
        votedByMe: Boolean(userId && votesForOption.some((v) => v.userId === userId))
      };
    })
  }));

  return (
    <main className="page-section">
      <Link href="/dashboard" className="back-link">
        <i className="fa-solid fa-arrow-left" /> Back to dashboard
      </Link>

      {editable && (
        <p className="content-block__empty" style={{ marginBottom: "1rem" }}>
          <i className="fa-solid fa-pen" /> You're signed in as this team's lead — edits save instantly.
        </p>
      )}

      <LdrContentEditor
        ldrSlug={role.slug}
        contentBlockId={block.id}
        initialTitle={block.title}
        initialDescription={block.description ?? ""}
        initialBoxes={block.boxes}
        canEdit={editable}
      />

      <AnnouncementList
        ldrSlug={role.slug}
        initialAnnouncements={announcementsWithReactions}
        reactionOptions={reactionOptions.map((o) => ({ id: o.id, emoji: o.emoji, label: o.label }))}
        canEdit={editable}
        canReact={canReact}
      />

      <GuideLinkList ldrSlug={role.slug} initialLinks={guideLinks} canEdit={editable} />
    </main>
  );
}

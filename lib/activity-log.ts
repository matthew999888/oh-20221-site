import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * Best-effort audit trail write. Never throws — logging failures should
 * never block the edit/action that triggered them.
 */
export async function logActivity(
  userId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  metadata?: Record<string, unknown>
) {
  await prisma.activityLog
    .create({
      data: {
        userId,
        action,
        targetType,
        targetId,
        metadata: metadata as Prisma.InputJsonValue | undefined
      }
    })
    .catch(() => {
      // best-effort only
    });
}
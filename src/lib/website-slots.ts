import { prisma } from "@/lib/prisma";
import { normalizeWebsiteHost } from "@/lib/website-host";

/** Max times a user may connect the same hostname (initial + one reconnection). */
export const MAX_DOMAIN_LIFETIME_ADDS = 2;

export const DOMAIN_RECONNECTS_ALLOWED = MAX_DOMAIN_LIFETIME_ADDS - 1;

export const DOMAIN_LIFETIME_LIMIT_MESSAGE =
  "This domain has reached the maximum number of connections for your account. Contact support if you need to add it again.";

export function getDomainDeleteNotice(lifetimeAddCount: number): {
  canReconnect: boolean;
  reconnectsRemaining: number;
  summary: string;
  detail: string;
} {
  const reconnectsRemaining = Math.max(
    0,
    MAX_DOMAIN_LIFETIME_ADDS - lifetimeAddCount
  );
  const canReconnect = reconnectsRemaining > 0;

  if (canReconnect && reconnectsRemaining === 1) {
    return {
      canReconnect: true,
      reconnectsRemaining,
      summary: "You can reconnect this domain once after deleting.",
      detail:
        "All scan history, issues, and reports for this website will be removed. You may add the same domain back one more time. If you delete it again, contact support to restore access.",
    };
  }

  if (canReconnect) {
    return {
      canReconnect: true,
      reconnectsRemaining,
      summary: `You can reconnect this domain ${reconnectsRemaining} more time${reconnectsRemaining === 1 ? "" : "s"} after deleting.`,
      detail:
        "All scan history, issues, and reports for this website will be removed.",
    };
  }

  return {
    canReconnect: false,
    reconnectsRemaining: 0,
    summary: "You will not be able to add this domain again without contacting support.",
    detail:
      "This domain has already been connected the maximum number of times for your account. Deleting now permanently removes your ability to reconnect it yourself.",
  };
}

export async function countActiveWebsites(userId: string): Promise<number> {
  return prisma.website.count({
    where: { userId, deletedAt: null },
  });
}

export async function getDomainSlotForHost(userId: string, url: string) {
  const host = normalizeWebsiteHost(url);
  if (!host) return null;

  return prisma.websiteDomainSlot.findUnique({
    where: { userId_normalizedHost: { userId, normalizedHost: host } },
  });
}

export async function assertCanAddWebsite(
  userId: string,
  url: string,
  websiteLimit: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  const activeCount = await countActiveWebsites(userId);
  if (activeCount >= websiteLimit) {
    return {
      ok: false,
      error: `You've reached your plan limit of ${websiteLimit} connected website${websiteLimit === 1 ? "" : "s"}. Request an upgrade to add more.`,
    };
  }

  const host = normalizeWebsiteHost(url);
  if (!host) {
    return { ok: false, error: "Please enter a valid website URL." };
  }

  const slot = await prisma.websiteDomainSlot.findUnique({
    where: { userId_normalizedHost: { userId, normalizedHost: host } },
  });

  if (slot?.releasedAt == null && slot?.websiteId) {
    const activeWebsite = await prisma.website.findFirst({
      where: { id: slot.websiteId, userId, deletedAt: null },
    });
    if (activeWebsite) {
      return {
        ok: false,
        error: "You already have this domain connected.",
      };
    }
  }

  if (slot && slot.lifetimeAddCount >= MAX_DOMAIN_LIFETIME_ADDS && slot.releasedAt) {
    return { ok: false, error: DOMAIN_LIFETIME_LIMIT_MESSAGE };
  }

  const activeDuplicate = await prisma.website.findFirst({
    where: { userId, deletedAt: null, url: url.toLowerCase() },
  });
  if (activeDuplicate) {
    return { ok: false, error: "You have already connected this website." };
  }

  return { ok: true };
}

export async function consumeDomainSlot(
  userId: string,
  websiteId: string,
  url: string
): Promise<void> {
  const host = normalizeWebsiteHost(url);
  if (!host) return;

  const existing = await prisma.websiteDomainSlot.findUnique({
    where: { userId_normalizedHost: { userId, normalizedHost: host } },
  });

  if (!existing) {
    await prisma.websiteDomainSlot.create({
      data: {
        userId,
        websiteId,
        normalizedHost: host,
        consumedAt: new Date(),
        lifetimeAddCount: 1,
      },
    });
    return;
  }

  const isReconnect = existing.releasedAt != null;

  await prisma.websiteDomainSlot.update({
    where: { id: existing.id },
    data: {
      websiteId,
      consumedAt: new Date(),
      releasedAt: null,
      lifetimeAddCount: isReconnect
        ? existing.lifetimeAddCount + 1
        : existing.lifetimeAddCount,
    },
  });
}

export async function releaseDomainSlot(userId: string, url: string): Promise<void> {
  const host = normalizeWebsiteHost(url);
  if (!host) return;

  await prisma.websiteDomainSlot.updateMany({
    where: { userId, normalizedHost: host, releasedAt: null },
    data: { releasedAt: new Date(), websiteId: null },
  });
}

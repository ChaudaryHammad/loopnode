import { prisma } from "@/lib/prisma";
import { PLAN_PRICES_USD } from "@/lib/plans";
import type { ContactMessageStatus, PlanTier, SubscriptionStatus } from "@prisma/client";

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function getAdminOverviewStats() {
  const today = startOfToday();

  const [
    totalUsers,
    activeUsers,
    bannedUsers,
    totalWebsites,
    scansToday,
    failedScansToday,
    failedBrokenLinkScansToday,
    newContacts,
    newsletterActive,
    subscriptionsByStatus,
    subscriptionsByPlan,
    recentActivity,
    recentFailedScans,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: { not: null } } }),
    prisma.website.count({ where: { deletedAt: null } }),
    prisma.scan.count({ where: { createdAt: { gte: today } } }),
    prisma.scan.count({
      where: { createdAt: { gte: today }, status: "FAILED" },
    }),
    prisma.brokenLinkScan.count({
      where: { createdAt: { gte: today }, status: "FAILED" },
    }),
    prisma.contactMessage.count({ where: { status: "NEW" } }),
    prisma.newsletterSubscriber.count({ where: { unsubscribedAt: null } }),
    prisma.subscription.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.subscription.groupBy({
      by: ["plan"],
      where: { status: "ACTIVE", plan: { not: null } },
      _count: { _all: true },
    }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.scan.findMany({
      where: { status: "FAILED" },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        errorMessage: true,
        createdAt: true,
        website: {
          select: {
            name: true,
            url: true,
            user: { select: { email: true } },
          },
        },
      },
    }),
  ]);

  const statusMap = subscriptionsByStatus.reduce(
    (acc, row) => {
      acc[row.status] = row._count._all;
      return acc;
    },
    {} as Record<string, number>
  );

  const mrr = subscriptionsByPlan.reduce((sum, row) => {
    if (!row.plan) return sum;
    return sum + PLAN_PRICES_USD[row.plan] * row._count._all;
  }, 0);

  return {
    totalUsers,
    activeUsers,
    bannedUsers,
    totalWebsites,
    scansToday,
    failedScansToday,
    failedBrokenLinkScansToday,
    newContacts,
    newsletterActive,
    subscriptionStatus: statusMap,
    estimatedMrr: mrr,
    recentActivity,
    recentFailedScans,
  };
}

export async function getAdminUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      subscription: true,
      _count: {
        select: {
          websites: { where: { deletedAt: null } },
          activityLogs: true,
        },
      },
    },
  });
}

export async function getAdminWebsites() {
  return prisma.website.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true, deletedAt: true },
      },
      scans: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          status: true,
          overallScore: true,
          createdAt: true,
          completedAt: true,
        },
      },
      _count: {
        select: { scans: true, brokenLinkScans: true },
      },
    },
  });
}

export async function getAdminSubscriptions() {
  const [subscriptions, usersWithoutSubscription] = await Promise.all([
    prisma.subscription.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            deletedAt: true,
            _count: { select: { websites: { where: { deletedAt: null } } } },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        deletedAt: null,
        subscription: null,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: { select: { websites: { where: { deletedAt: null } } } },
      },
    }),
  ]);

  return { subscriptions, usersWithoutSubscription };
}

export async function getAdminNewsletterSubscribers() {
  return prisma.newsletterSubscriber.findMany({
    orderBy: { subscribedAt: "desc" },
  });
}

export async function getAdminContactMessages() {
  return prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminUpgradeRequests() {
  return prisma.upgradeRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          subscription: {
            select: {
              plan: true,
              status: true,
              websiteLimitOverride: true,
            },
          },
          _count: { select: { websites: { where: { deletedAt: null } } } },
        },
      },
      paymentMethodConfig: {
        select: { label: true },
      },
    },
  });
}

export type AdminSubscriptionUpdate = {
  userId: string;
  plan: PlanTier | null;
  status: SubscriptionStatus;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  adminNotes: string | null;
};

export type AdminContactStatus = ContactMessageStatus;

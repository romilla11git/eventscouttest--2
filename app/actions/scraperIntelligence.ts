'use server';

import { prisma } from '@/lib/prisma';

export async function getScraperIntelligenceAction() {
  const [eventsSaved, eventsRejected] = await Promise.all([
    prisma.event.count(),
    prisma.rejectedEvent.count(),
  ]);

  return {
    eventsDiscovered: eventsSaved + eventsRejected,
    eventsSaved,
    eventsRejected,
  };
}

export async function getRejectedEventsAction(reasonFilter?: string) {
  const where = reasonFilter ? { reason: reasonFilter as any } : {};
  const rows = await prisma.rejectedEvent.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return rows.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));
}


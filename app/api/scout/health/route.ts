import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const lastRun = await prisma.scraperLog.findFirst({
      orderBy: { timestamp: 'desc' },
    });

    const totalEvents = await prisma.event.count();
    const recentEvents = await prisma.event.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        title: true,
        date: true,
        location: true,
        relevanceScore: true,
        iworthVertical: true,
        opportunityType: true,
      },
    });

    const stats = {
      lastRun: lastRun ? lastRun.timestamp.toISOString() : null,
      totalEvents,
      recentEvents,
      status: 'healthy',
    };

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
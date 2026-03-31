'use server';

import { prisma } from '@/lib/prisma';

export async function getAnalyticsAction() {
    try {
        const [
            allEvents,
            topEvents,
            conflictingEvents,
            auditStats
        ] = await Promise.all([
            prisma.event.findMany({ select: { tags: true, date: true, createdAt: true } }),
            prisma.event.findMany({
                where: { state: { not: 'ARCHIVED' } },
                orderBy: { priorityScore: 'desc' },
                take: 5
            }),
            prisma.event.findMany({
                where: { conflictStatus: true, state: { not: 'ARCHIVED' } },
                orderBy: { date: 'asc' }
            }),
            prisma.auditLog.count()
        ]);

        // Calculate Trending Tags
        const tagCounts: Record<string, number> = {};
        allEvents.forEach(e => {
            e.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });

        const trendingTags = Object.entries(tagCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 8)
            .map(([name, count]) => ({ name, count }));

        // Weekly Digest (new events in last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const weeklyCount = allEvents.filter(e => new Date(e.createdAt) >= sevenDaysAgo).length;

        // Daily Digest (new events today)
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const dailyCount = allEvents.filter(e => new Date(e.createdAt) >= startOfToday).length;

        return {
            success: true,
            data: {
                trendingTags,
                topEvents: topEvents.map(e => ({ ...e, date: e.date.toISOString(), createdAt: e.createdAt.toISOString() })),
                conflictingEvents: conflictingEvents.map(e => ({ ...e, date: e.date.toISOString() })),
                weeklyCount,
                dailyCount,
                totalEvents: allEvents.length,
                auditLogsCount: auditStats
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

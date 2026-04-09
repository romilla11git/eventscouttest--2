import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EventState } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * Cleanup Cron — runs daily at 03:00 UTC (06:00 Nairobi time).
 * Archives any event whose date has already passed so the dashboard
 * always shows future-only opportunities.
 *
 * Protected by CRON_SECRET Bearer token (same as the discover cron).
 */
export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('[CRON: cleanup-stale] Starting stale event archive run...');

    try {
        // Midnight of today in UTC — anything before this is stale
        const todayMidnight = new Date();
        todayMidnight.setUTCHours(0, 0, 0, 0);

        // Find stale events that are not already archived
        const staleEvents = await prisma.event.findMany({
            where: {
                date: { lt: todayMidnight },
                state: { not: EventState.ARCHIVED },
            },
            select: { id: true, title: true, date: true, state: true },
        });

        if (staleEvents.length === 0) {
            console.log('[CRON: cleanup-stale] No stale events found. DB is clean.');
            return NextResponse.json({ success: true, archived: 0, message: 'Nothing to archive.' });
        }

        // Bulk-archive all stale events
        const result = await prisma.event.updateMany({
            where: {
                id: { in: staleEvents.map(e => e.id) },
            },
            data: { state: EventState.ARCHIVED },
        });

        // Log each archival to the AuditLog
        await prisma.auditLog.createMany({
            data: staleEvents.map(e => ({
                action: 'ARCHIVE',
                entityType: 'Event',
                entityId: e.id,
                entityTitle: e.title,
                reason: `Auto-archived: event date ${new Date(e.date).toISOString().split('T')[0]} is in the past.`,
                performedBy: 'SYSTEM:cleanup-cron',
            })),
            skipDuplicates: true,
        });

        // Write a scraper log entry so admins can see it in the dashboard
        await prisma.scraperLog.create({
            data: {
                status: 'success',
                message: `[Cleanup Cron] Auto-archived ${result.count} stale event(s) with past dates.`,
                eventsFound: 0,
            },
        });

        console.log(`[CRON: cleanup-stale] Archived ${result.count} stale events.`);

        return NextResponse.json({
            success: true,
            archived: result.count,
            events: staleEvents.map(e => ({
                id: e.id,
                title: e.title,
                date: new Date(e.date).toISOString().split('T')[0],
                previousState: e.state,
            })),
        });
    } catch (error: any) {
        console.error('[CRON: cleanup-stale] Failed:', error);

        await prisma.scraperLog.create({
            data: {
                status: 'error',
                message: `[Cleanup Cron] Failed: ${error.message}`,
                eventsFound: 0,
            },
        });

        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

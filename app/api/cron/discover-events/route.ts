import { NextResponse } from 'next/server';
import { runScraperAction } from '@/app/actions/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');

    // Simple Bearer token protection
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('[CRON] Starting daily event discovery...');

    try {
        const result = await runScraperAction();

        console.log(`[CRON] Discovery complete. Saved: ${result.eventsCreated}, Rejected: ${result.rejected}`);

        return NextResponse.json({
            success: result.success,
            saved: result.eventsCreated,
            rejected: result.rejected,
            log: result.log
        });
    } catch (error: any) {
        console.error('[CRON] Discovery failed:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function DebugPage() {
    let dbStatus = 'Unknown';
    let userCount = -1;
    let errorDetail = null;
    let envCheck = {
        hasDbUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV,
    };

    try {
        // Try simple query
        userCount = await prisma.user.count();
        dbStatus = 'Connected';
    } catch (e: any) {
        dbStatus = 'Error';
        errorDetail = e.message || String(e);
        console.error('Debug Page DB Error:', e);
    }

    return (
        <div className="p-8 font-mono text-sm">
            <h1 className="text-2xl font-bold mb-4">System Diagnostic</h1>

            <div className="space-y-4">
                <div className={`p-4 rounded border ${dbStatus === 'Connected' ? 'bg-green-100 border-green-500 text-green-800' : 'bg-red-100 border-red-500 text-red-800'}`}>
                    <div className="font-bold">Database Status: {dbStatus}</div>
                    {dbStatus === 'Connected' && <div>User Count: {userCount}</div>}
                    {errorDetail && <pre className="mt-2 whitespace-pre-wrap text-xs">{errorDetail}</pre>}
                </div>

                <div className="p-4 bg-gray-100 border border-gray-300 rounded">
                    <div className="font-bold mb-2">Environment Check</div>
                    <div>DATABASE_URL Set: {envCheck.hasDbUrl ? 'Yes' : 'No'}</div>
                    <div>NODE_ENV: {envCheck.nodeEnv}</div>
                </div>
            </div>
        </div>
    );
}

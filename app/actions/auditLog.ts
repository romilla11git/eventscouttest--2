'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getAuditLogsAction() {
    try {
        const logs = await prisma.auditLog.findMany({
            orderBy: { timestamp: 'desc' },
            take: 100
        });
        return { success: true, logs: logs.map(l => ({ ...l, timestamp: l.timestamp.toISOString() })) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function clearAuditLogsAction() {
    try {
        await prisma.auditLog.deleteMany({});
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function logAuditEntry(
    action: 'CREATE' | 'SKIP' | 'REJECT' | 'DELETE' | 'UPDATE',
    entityTitle: string,
    options: {
        entityType?: string;
        entityId?: string;
        reason?: string;
        performedBy?: string;
    } = {}
) {
    try {
        await prisma.auditLog.create({
            data: {
                action,
                entityTitle,
                entityType: options.entityType || 'Event',
                entityId: options.entityId,
                reason: options.reason,
                performedBy: options.performedBy || 'SYSTEM'
            }
        });
        return { success: true };
    } catch (error: any) {
        console.error('Failed to log audit entry:', error);
        return { success: false, error: error.message };
    }
}

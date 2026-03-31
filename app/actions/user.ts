'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Toggles user visibility for privacy.
 * Persists immediately and revalidates paths.
 */
export async function toggleVisibilityAction(userId: string, isVisible: boolean) {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { isVisible },
        });

        revalidatePath('/profile');
        revalidatePath('/admin/users');

        return { success: true, isVisible };
    } catch (error: any) {
        console.error("Failed to toggle visibility:", error);
        return { error: "Failed to update privacy settings" };
    }
}

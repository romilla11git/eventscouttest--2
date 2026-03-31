'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Toggles an event in the user's saved schedule.
 * Persists immediately and revalidates paths.
 */
export async function toggleSavedEventAction(userId: string, eventId: string, isSaving: boolean) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { savedEventIds: true }
        });

        if (!user) return { error: "User not found" };

        let updatedSavedEvents = [...user.savedEventIds];

        if (isSaving && !updatedSavedEvents.includes(eventId)) {
            updatedSavedEvents.push(eventId);
        } else if (!isSaving && updatedSavedEvents.includes(eventId)) {
            updatedSavedEvents = updatedSavedEvents.filter(id => id !== eventId);
        }

        await prisma.user.update({
            where: { id: userId },
            data: { savedEventIds: updatedSavedEvents },
        });

        revalidatePath('/');
        return { success: true, savedEventIds: updatedSavedEvents };
    } catch (error: any) {
        console.error("Failed to toggle saved event:", error);
        return { error: "Failed to update schedule" };
    }
}

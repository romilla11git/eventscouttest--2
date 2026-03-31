'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Updates a user's profile settings such as interests and visibility.
 * Persists immediately and revalidates paths.
 */
export async function updateUserProfileAction(userId: string, data: { interests?: string[], isVisible?: boolean, savedEventIds?: string[] }) {
    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data,
        });

        revalidatePath('/');
        revalidatePath('/profile');

        return {
            success: true,
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                name: updatedUser.name,
                role: updatedUser.role,
                interests: updatedUser.interests,
                savedEventIds: updatedUser.savedEventIds,
                isVisible: updatedUser.isVisible,
                createdAt: updatedUser.createdAt.toISOString()
            }
        };
    } catch (error: any) {
        console.error("Failed to update user profile:", error);
        return { error: "Failed to update profile settings" };
    }
}

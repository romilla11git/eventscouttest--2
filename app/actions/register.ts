'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * Hardened Registration Server Action.
 * Implements strict validation and database persistence.
 */
export async function registerAction(formData: FormData) {
    try {
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const name = formData.get('name') as string;
        const phone = formData.get('phone') as string || null;
        const organization = formData.get('organization') as string || null;

        if (!email || !password || !name) {
            return { error: "Required fields missing (Email, Password, Name)" };
        }

        // 1. Uniqueness check
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return { error: "User identity already cataloged in organizational records" };
        }

        // 2. Hash and Create
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                phone,
                organization,
                role: 'user',
                isActive: true, // Internal policy: Auto-active for now, or false if admin review required
                isVisible: true,
            }
        });

        return {
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                interests: user.interests,
                savedEventIds: user.savedEventIds,
                createdAt: user.createdAt.toISOString()
            }
        };

    } catch (error: any) {
        console.error("Registration Action Failure:", error);
        return { error: "System failure during record creation" };
    }
}

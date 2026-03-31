'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * Hardened Login Server Action.
 * Accepts credentials and returns explicit JSON results.
 */
export async function loginAction(formData: FormData) {
    try {
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        if (!email || !password) {
            return { error: "Email and password are required" };
        }

        // 1. Query PostgreSQL via Prisma
        const user = await prisma.user.findUnique({
            where: { email },
        });

        // 2. Defensive check: No auto-registration, no silent failure
        if (!user) {
            return { error: "Invalid credentials or unauthorized" };
        }

        // 3. Status check: Deny access if not active
        if (!user.isActive) {
            return { error: "Account is inactive. Contact administrator." };
        }

        // 4. Password validation
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return { error: "Invalid credentials" };
        }

        // Successful authentication (integration with NextAuth/JWT would happen here)
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
        console.error("Login Server Action Failure:", error);
        console.error("Error specifics:", {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        return { error: `Authentication system failure: ${error.message}` };
    }

}

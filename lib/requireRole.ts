/**
 * requireRole — Server-side role guard for server actions.
 *
 * Usage: call at the top of any admin server action.
 * It reads the caller's userId from a header/cookie placeholder
 * and verifies their role directly against the database.
 *
 * NOTE: Full session integration (NextAuth) is the recommended
 * long-term solution. This guard enforces the DB as the source
 * of truth so client-side role tampering has no effect.
 */

import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { cookies } from 'next/headers';

/**
 * Returns the calling user's DB record, or throws if:
 *  - no session cookie is found
 *  - the user is not found in the DB
 *  - the user's role is less than `required`
 */
export async function requireRole(required: Role = Role.admin): Promise<{ id: string; role: Role }> {
    const cookieStore = await cookies();
    const rawUser = cookieStore.get('es-session')?.value;

    if (!rawUser) {
        throw new Error('UNAUTHORIZED: No active session found.');
    }

    let sessionData: { id: string } | null = null;
    try {
        sessionData = JSON.parse(rawUser);
    } catch {
        throw new Error('UNAUTHORIZED: Malformed session token.');
    }

    if (!sessionData?.id) {
        throw new Error('UNAUTHORIZED: Session missing user ID.');
    }

    // Always verify role from DB — not from client-supplied state
    const user = await prisma.user.findUnique({
        where: { id: sessionData.id },
        select: { id: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
        throw new Error('UNAUTHORIZED: User not found or account inactive.');
    }

    const ROLE_HIERARCHY: Record<Role, number> = {
        [Role.user]: 1,
        [Role.admin]: 2,
    };

    if (ROLE_HIERARCHY[user.role] < ROLE_HIERARCHY[required]) {
        throw new Error(`FORBIDDEN: This action requires role '${required}'. Current role: '${user.role}'.`);
    }

    return { id: user.id, role: user.role };
}

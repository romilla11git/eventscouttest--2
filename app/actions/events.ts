'use server';

import { prisma } from '@/lib/prisma';
import { EventState } from '@/types';
import { revalidatePath } from 'next/cache';

/**
 * Fetches all events from the database and normalizes them into
 * the unified frontend event schema.
 *
 * Guarantees that every returned event has:
 * - title
 * - url (sourceUrl)
 * - start_date (date as ISO string)
 * - city (locationCity, with sensible fallback)
 * - description
 */
export async function getEventsAction() {
    try {
        const events = await prisma.event.findMany({
            orderBy: { date: 'asc' },
        });

        return events.map(e => {
            const isoDate = e.date.toISOString();

            return {
                // Core identity
                id: e.id,
                title: e.title || 'Untitled Event',
                description: e.description || '',

                // Normalized temporal & location fields
                date: isoDate, // start_date in the unified schema
                location: e.location || 'TBD',
                locationCity: e.locationCity || 'Nairobi',

                // Classification
                category: e.category ?? undefined,
                whyItMattersForIworth: e.whyItMattersForIworth ?? undefined,
                iworthVertical: e.iworthVertical ?? undefined,

                // Strategy
                marketingStrategy: (e.marketingStrategy as any) ?? undefined,

                // Lead / lifecycle tracking (defaulted when missing)
                contactsCollected: (e as any).contactsCollected ?? 0,
                demosGiven: (e as any).demosGiven ?? 0,
                salesClosed: (e as any).salesClosed ?? 0,
                partnershipsStarted: (e as any).partnershipsStarted ?? 0,
                competitorsDetected: (e as any).competitorsDetected ?? [],

                // Opportunity metadata
                organizer: e.organizer ?? null,
                opportunityType: e.opportunityType ?? null,
                sourceUrl: e.sourceUrl || undefined,
                sourceSite: (() => {
                    if (!e.sourceUrl) return undefined;
                    try {
                        const host = new URL(e.sourceUrl).hostname.replace(/^www\./, '');
                        return host;
                    } catch {
                        return undefined;
                    }
                })(),
                suggestedAction: e.suggestedAction ?? null,
                actionTaken: (e as any).actionTaken ?? false,
                proposalSent: (e as any).proposalSent ?? false,
                proposalAccepted: (e as any).proposalAccepted ?? false,
                dealWon: (e as any).dealWon ?? false,
                estimatedValue: e.estimatedValue ?? null,
                outcomeNotes: (e as any).outcomeNotes ?? null,

                // State / scoring
                state: e.state as EventState,
                priorityScore: e.priorityScore,
                tags: e.tags,
                conflictStatus: e.conflictStatus,

                // Optional enrichments
                geolocation: (e as any).geolocation ?? null,
                imageUrl: (e as any).imageUrl ?? null,

                // Provenance
                createdBy: e.createdById ?? 'AI_AGENT',
                publishedBy: e.publishedById ?? undefined,
                publishedAt: e.publishedAt?.toISOString() ?? undefined,
                rawSource: e.rawSource ?? undefined,
            };
        });
    } catch (error) {
        console.error("DB Error [getEvents]:", error);
        return [];
    }
}

/**
 * Creates a new event record.
 */
export async function createEventAction(data: any, creatorId: string) {
    try {
        const event = await prisma.event.create({
            data: {
                ...data,
                createdById: creatorId,
            }
        });
        revalidatePath('/');
        revalidatePath('/admin');
        return { success: true, event };
    } catch (error: any) {
        console.error("DB Error [createEvent]:", error);
        return { error: error.message };
    }
}

/**
 * Updates an existing event state or details.
 */
export async function updateEventAction(id: string, data: any) {
    try {
        await prisma.event.update({
            where: { id },
            data
        });
        revalidatePath('/');
        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

/**
 * Deletes an event record (Expunge).
 */
export async function deleteEventAction(id: string) {
    try {
        await prisma.event.delete({ where: { id } });
        revalidatePath('/');
        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

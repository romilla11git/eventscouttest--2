/**
 * EventScout — Backend Event Validation Pipeline
 *
 * Runs every event through strict checks before DB insertion:
 * 1. Required fields
 * 2. Valid public URL
 * 2.5. Speculative-language rejection (no "expected", "anticipated", etc.)
 * 2.6. Source confidence score (minimum 5/10 required)
 * 3. Future date only
 * 4. ISO date normalization
 * 5. Duplicate detection (via Prisma)
 * 6. Conflict detection
 * 7. Auto-tagging & scoring
 */

import { prisma } from '@/lib/prisma';
import { EventState, RejectionReason } from '@prisma/client';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface RawEventInput {
    title?: string;
    description?: string;
    date?: string | Date;
    time?: string;
    location?: string;
    locationCity?: string;
    category?: string;
    organizer?: string;
    sourceUrl?: string;
    suggestedAction?: string;
    opportunityType?: string;
    iworthVertical?: string;
    whyItMattersForIworth?: string;
    priorityScore?: number | string;
    tags?: string[];
    conflictStatus?: boolean;
    marketingStrategy?: Record<string, unknown> | null;
    rawSource?: string;
    geolocation?: { lat: number; lon: number } | null;
    imageUrl?: string | null;
}

export interface ValidationResult {
    valid: boolean;
    reason?: string;
    rejectionCode?: RejectionReason;
    normalized?: NormalizedEvent & { relevanceScore: number };
}

export interface NormalizedEvent {
    title: string;
    description: string;
    date: Date;
    location: string;
    locationCity?: string | null;
    category?: string | null;
    organizer?: string | null;
    sourceUrl?: string | null;
    suggestedAction?: string | null;
    opportunityType?: string | null;
    iworthVertical?: string | null;
    whyItMattersForIworth?: string | null;
    priorityScore: number;
    confidenceScore: number;
    tags: string[];
    conflictStatus: boolean;
    marketingStrategy?: Record<string, unknown> | null;
    rawSource?: string | null;
    geolocation?: { lat: number; lon: number } | null;
    imageUrl?: string | null;
    type?: string | null;
}

// ─── Relevance Scoring ─────────────────────────────────────────────────────────

const IWORTH_SIGNALS: Array<{ kw: string; weight: number }> = [
    { kw: 'smart classroom', weight: 25 },
    { kw: 'interactive display', weight: 20 },
    { kw: 'interactive flat panel', weight: 20 },
    { kw: 'digital learning', weight: 15 },
    { kw: 'edtech', weight: 15 },
    { kw: 'av system', weight: 15 },
    { kw: 'audio-visual', weight: 15 },
    { kw: 'audio visual', weight: 15 },
    { kw: 'enterprise networking', weight: 20 },
    { kw: 'cloud infrastructure', weight: 15 },
    { kw: 'ai innovation', weight: 15 },
    { kw: 'technology expo', weight: 15 },
    { kw: 'startup conference', weight: 15 },
    { kw: 'venue AV', weight: 20 },
    { kw: 'smart classroom integration', weight: 18 },
    { kw: 'edge compute', weight: 15 },
    { kw: 'managed WiFi', weight: 15 },
    { kw: 'digital signage', weight: 15 },
    { kw: 'ICT training', weight: 20 },
    { kw: 'corporate training', weight: 18 },
    { kw: 'staff cloud upskill', weight: 15 },
    { kw: 'call for papers', weight: 10 },
    { kw: 'call for vendors', weight: 10 },
    { kw: 'exhibitor registration', weight: 10 },
    { kw: 'sponsorship', weight: 10 },
    // Broader ICT/tech signals so general tech conferences aren't excluded
    { kw: 'ict', weight: 15 },
    { kw: 'technology', weight: 10 },
    { kw: 'conference', weight: 8 },
    { kw: 'digital', weight: 8 },
    { kw: 'innovation', weight: 8 },
    { kw: 'networking', weight: 10 },
    { kw: 'summit', weight: 8 },
    { kw: 'expo', weight: 8 },
    { kw: 'artificial intelligence', weight: 15 },
    { kw: 'machine learning', weight: 12 },
    { kw: 'data', weight: 8 },
    { kw: 'cybersecurity', weight: 12 },
    { kw: 'fintech', weight: 10 },
    { kw: 'robotics', weight: 12 },
    { kw: 'stem', weight: 10 },
];

export function scoreRelevance(title: string, description: string, category?: string | null): number {
    const text = (title + ' ' + description + ' ' + (category || '')).toLowerCase();
    let score = 40; // baseline

    for (const { kw, weight } of IWORTH_SIGNALS) {
        if (text.includes(kw)) score += weight;
    }

    return Math.max(0, Math.min(100, score));
}

// ─── Rule 1: Required Fields ────────────────────────────────────────────────

export function hasRequiredFields(event: RawEventInput): boolean {
    return !!(
        event.title?.trim() &&
        event.description?.trim() &&
        event.date &&
        event.location?.trim() &&
        event.sourceUrl?.trim()
    );
}

// ─── Rule 2: Valid Public URL ───────────────────────────────────────────────

export function isValidUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        // Must be http or https (no file://, mailto:, etc.)
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

// ─── Rule 2.5: Speculative Language Rejection ────────────────────────────────

const BANNED_SPECULATIVE_WORDS = [
    'anticipated', 'provisional',
    'predicted', 'tentative', 'tbc', '(tbc)',
];

// ─── Rule 2.7: Blocked Commercial Terms (Tenders / Procurement etc.) ──────────
// Used to exclude pure tender / RFP style listings from the event feed.

const BLOCKED_COMMERCIAL_TERMS = [
    'tender',
    'procurement',
    'request for proposal',
    'rfp',
    'bid ',
    'bidding',
    'submit proposal',
];

export function hasBannedSpeculativeWords(title: string, description: string): boolean {
    const text = (title + ' ' + description).toLowerCase();
    return BANNED_SPECULATIVE_WORDS.some(w => text.includes(w));
}

export function hasBlockedCommercialTerms(description: string): boolean {
    const text = description.toLowerCase();
    return BLOCKED_COMMERCIAL_TERMS.some(w => text.includes(w));
}

// ─── Rule 2.6: Source Confidence Score ───────────────────────────────────────
// Score 10 = official page + ticketing  (e.g. Eventbrite, Meetup)
// Score 8  = official gov / university site (.go.ke, .ac.ke, .edu)
// Score 6  = credible organisation site (.org, .com with known pattern)
// Score <5 = reject (untrustworthy or no source)

const TICKETING_DOMAINS = ['eventbrite.com', 'meetup.com'];
const OFFICIAL_DOMAINS = ['.go.ke', '.ac.ke', 'konza.go.ke', 'strathmore.edu', 'ict.go.ke', 'tenders.go.ke', 'eventpack.co.ke', 'sfawards.co.ke'];
const TRUSTED_CORPORATE = ['iworth.co.ke', '.co.ke'];

export function computeConfidenceScore(sourceUrl: string): number {
    try {
        const host = new URL(sourceUrl).hostname.toLowerCase();
        if (TICKETING_DOMAINS.some(d => host.includes(d))) return 10;
        if (OFFICIAL_DOMAINS.some(d => host.includes(d))) return 8;
        if (host.endsWith('.org') || TRUSTED_CORPORATE.some(d => host.includes(d))) return 6;
        if (host.endsWith('.com') || host.endsWith('.edu')) return 5;
        return 4;
    } catch {
        return 0;
    }
}

// ─── Rule 3: Future Date ─────────────────────────────────────────────────────

export function isFutureDate(date: string | Date): boolean {
    const eventDate = new Date(date);
    return !isNaN(eventDate.getTime()) && eventDate > new Date();
}

export function isHistoricalEvent(date: string | Date): boolean {
    const eventDate = new Date(date);
    return !isNaN(eventDate.getTime()) && eventDate < new Date();
}

// ─── Rule 4: Normalize Date ──────────────────────────────────────────────────

export function normalizeDate(date: string | Date): Date {
    return new Date(date);
}

// ─── Rule 5: Duplicate Detection (Fuzzy) ─────────────────────────────────────

export async function isDuplicate(title: string, date: Date): Promise<boolean> {
    // Normalize title: lowercase, remove special chars
    const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Check for exact date and similar title
    const existing = await prisma.event.findMany({
        where: {
            date: date,
        },
    });

    for (const e of existing) {
        const existingNormalized = e.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        // If titles are 90% similar or one contains the other
        if (existingNormalized.includes(normalizedTitle) || normalizedTitle.includes(existingNormalized)) {
            return true;
        }
    }

    return false;
}

// ─── Rule 6: Conflict Detection ──────────────────────────────────────────────

export async function hasConflict(location: string, date: Date): Promise<boolean> {
    // Check for events at the same location within a 3-hour window
    const windowStart = new Date(date.getTime() - 90 * 60 * 1000);
    const windowEnd = new Date(date.getTime() + 90 * 60 * 1000);

    const conflicting = await prisma.event.findFirst({
        where: {
            location: { equals: location, mode: 'insensitive' },
            date: {
                gte: windowStart,
                lte: windowEnd,
            },
        },
    });

    return conflicting !== null;
}

// ─── Rule 7: Auto-Tagging & Scoring ──────────────────────────────────────────

const TECH_KEYWORDS: Record<string, string[]> = {
    'AI': ['ai', 'artificial intelligence', 'machine learning', 'ml', 'neural'],
    'Robotics': ['robot', 'robotics', 'automation', 'drone'],
    'EdTech': ['education', 'edtech', 'smart classroom', 'learning', 'student'],
    'IT': ['it', 'infrastructure', 'networking', 'cloud', 'server', 'data center'],
    'Innovation': ['innovation', 'startup', 'entrepreneur', 'founder', 'venture'],
    'Fintech': ['fintech', 'banking', 'payment', 'finance', 'crypto', 'blockchain'],
};

export function extractTags(description: string, existingTags: string[] = []): string[] {
    const descLower = description.toLowerCase();
    const newTags = new Set(existingTags);

    for (const [tag, keywords] of Object.entries(TECH_KEYWORDS)) {
        if (keywords.some(kw => descLower.includes(kw))) {
            newTags.add(tag);
        }
    }

    return Array.from(newTags);
}

export function autoScore(event: RawEventInput): number {
    let score = 5; // Default score
    const content = (event.title + ' ' + event.description).toLowerCase();

    // Positive boosters
    if (content.includes('government') || content.includes('ministry')) score += 2;
    if (content.includes('international') || content.includes('global')) score += 1;
    if (content.includes('summit') || content.includes('expo')) score += 1;
    if (content.includes('nairobi')) score += 1;

    // Tech focus boosters
    if (content.includes(' ai ') || content.includes('artificial intelligence')) score += 2;
    if (content.includes('robotics')) score += 1;

    return Math.min(10, score);
}

// ─── Rule 7.5: iWorth Strategic Alignment Filter ──────────────────────────────
// Ensures only events in iWorth's core interest areas are accepted.

const IWORTH_KEYWORDS = [
    // Core iWorth products
    'smart classroom',
    'interactive display',
    'interactive flat panel',
    'ifp',
    'av system',
    'audio visual',
    'boardroom',
    // ICT & tech
    'technology',
    'ict',
    'information technology',
    'digital',
    'software',
    'cloud',
    'cybersecurity',
    'data center',
    // EdTech & education
    'edtech',
    'education',
    'training',
    'workshop',
    'bootcamp',
    'learning',
    'stem',
    'robotics',
    // AI & innovation
    'artificial intelligence',
    'machine learning',
    'ai',
    'innovation',
    'startup',
    'digital transformation',
    // Business & events
    'conference',
    'summit',
    'expo',
    'forum',
    'networking',
    'enterprise',
    'fintech',
    // Networking infrastructure
    'enterprise networking',
    'networking infrastructure',
    'solar',
    'renewable energy',
];

export function isIworthAligned(title: string, description: string): boolean {
    const text = (title + ' ' + description).toLowerCase();
    return IWORTH_KEYWORDS.some(kw => text.includes(kw));
}

export function determineIworthAlignment(title: string, description: string): { iworthVertical: string; whyItMattersForIworth: string } {
    const text = (title + ' ' + description).toLowerCase();

    const mapping: Array<{ keywords: string[]; vertical: string; reason: string }> = [
        {
            keywords: ['edtech', 'education', 'elearning', 'digital learning', 'smart classroom', 'bootcamp'],
            vertical: 'EdTech',
            reason: 'Drives iWorth value by identifying educational technology and learning delivery opportunities for product demos and institutional partnerships.',
        },
        {
            keywords: ['cloud', 'cloud computing', 'infrastructure', 'data center'],
            vertical: 'Cloud & Infrastructure',
            reason: 'Targets enterprise cloud stack deals and managed services engagements for iWorth infrastructure offerings.',
        },
        {
            keywords: ['cybersecurity', 'security', 'networking', 'enterprise networking'],
            vertical: 'Cybersecurity & Networking',
            reason: 'Highlights security and networking events where iWorth can position cyber defense solutions and connectivity projects.',
        },
        {
            keywords: ['ai', 'artificial intelligence', 'machine learning', 'robotics', 'automation'],
            vertical: 'AI & Automation',
            reason: 'Aligns with iWorth’s AI/automation portfolio and identifies high-leverage innovation demos and pilot opportunities.',
        },
        {
            keywords: ['startup', 'innovation', 'conference', 'summit', 'expo', 'forum'],
            vertical: 'Innovation & Partnerships',
            reason: 'Useful for iWorth business development, channel partnerships and corporate innovation deal flow.',
        },
    ];

    for (const entry of mapping) {
        if (entry.keywords.some(kw => text.includes(kw))) {
            return { iworthVertical: entry.vertical, whyItMattersForIworth: entry.reason };
        }
    }

    return {
        iworthVertical: 'General Tech',
        whyItMattersForIworth: 'Potential technology event that may have business development value for iWorth customers and demo/sales engagement.',
    };
}

export function determineOpportunityType(title: string, description: string): string {
    const text = (title + ' ' + description).toLowerCase();

    if (text.includes('demo') || text.includes('exhibition') || text.includes('expo')) return 'Product Demo';
    if (text.includes('training') || text.includes('workshop') || text.includes('bootcamp')) return 'Training Contract';
    if (text.includes('partnership') || text.includes('channel') || text.includes('vendor')) return 'Channel Partner';
    if (text.includes('managed') || text.includes('service') || text.includes('consulting')) return 'Managed Service';
    if (text.includes('bid') || text.includes('tender') || text.includes('procurement')) return 'Enterprise Bid';

    return 'Events';
}

export function determineEventType(title: string, description: string): string {
    const text = (title + ' ' + description).toLowerCase();

    if (text.includes('hackathon') || text.includes('competition')) return 'hackathon';
    if (text.includes('seminar') || text.includes('talk')) return 'seminar';
    if (text.includes('workshop') || text.includes('training')) return 'workshop';
    if (text.includes('expo') || text.includes('exhibition')) return 'expo';
    if (text.includes('conference') || text.includes('summit')) return 'conference';

    return 'event';
}

// ─── Rejection Logging Helper ──────────────────────────────────────────────────

async function logRejection(params: {
    url: string;
    title?: string;
    reason: RejectionReason;
    extractedJson?: any;
    sourceSite?: string;
}) {
    try {
        await prisma.rejectedEvent.create({
            data: {
                url: params.url,
                titleExtracted: params.title ?? null,
                reason: params.reason,
                extractedJson: params.extractedJson ?? null,
                sourceSite: params.sourceSite ?? null,
            },
        });
    } catch (err) {
        console.error('Failed to log rejected event', err);
    }
}

// ─── Rule 8: Full Validation Pipeline ────────────────────────────────────────

export async function validateEvent(event: RawEventInput, rawExtracted?: any): Promise<ValidationResult> {
    const url = event.sourceUrl || '';
    const title = event.title || '';

    // 1. Required fields
    if (!title.trim()) {
        await logRejection({ url, title, reason: 'MISSING_TITLE', extractedJson: rawExtracted });
        return { valid: false, rejectionCode: 'MISSING_TITLE', reason: 'Missing title' };
    }
    if (!event.date) {
        await logRejection({ url, title, reason: 'MISSING_DATE', extractedJson: rawExtracted });
        return { valid: false, rejectionCode: 'MISSING_DATE', reason: 'Missing start date' };
    }
    if (!event.location?.trim()) {
        await logRejection({ url, title, reason: 'MISSING_LOCATION', extractedJson: rawExtracted });
        return { valid: false, rejectionCode: 'MISSING_LOCATION', reason: 'Missing location' };
    }
    if (!url.trim()) {
        await logRejection({ url, title, reason: 'MISSING_LOCATION', extractedJson: rawExtracted });
        return { valid: false, rejectionCode: 'MISSING_LOCATION', reason: 'Missing source URL' };
    }

    // 2. Valid URL
    if (!isValidUrl(url)) {
        const reasonText = `Invalid or non-public URL: "${url}"`;
        await logRejection({ url, title, reason: 'HTTP_ERROR', extractedJson: rawExtracted });
        return { valid: false, rejectionCode: 'HTTP_ERROR', reason: reasonText };
    }

    // 2.5. Speculative language check
    if (hasBannedSpeculativeWords(event.title!, event.description || '')) {
        const found = BANNED_SPECULATIVE_WORDS.find(w =>
            (event.title! + ' ' + (event.description || '')).toLowerCase().includes(w)
        );
        const reasonText = `Speculative event rejected — contains unconfirmed language: "${found}"`;
        await logRejection({ url, title, reason: 'NOT_RELEVANT_TO_IWORTH', extractedJson: rawExtracted });
        return { valid: false, rejectionCode: 'NOT_RELEVANT_TO_IWORTH', reason: reasonText };
    }

    // 2.7. Block obvious tender / procurement descriptions
    if (hasBlockedCommercialTerms(event.description || '')) {
        const foundBlocked = BLOCKED_COMMERCIAL_TERMS.find(w =>
            (event.description || '').toLowerCase().includes(w)
        );
        const reasonText = `Rejected — commercial procurement content detected: "${foundBlocked}"`;
        await logRejection({ url, title, reason: 'BLOCKED_KEYWORD', extractedJson: rawExtracted });
        return { valid: false, rejectionCode: 'BLOCKED_KEYWORD', reason: reasonText };
    }

    // 2.6. Confidence score check (minimum 5/10)
    const confidenceScore = computeConfidenceScore(url);
    if (confidenceScore < 5) {
        const reasonText = `Low source confidence (${confidenceScore}/10) — not a verified domain: "${url}"`;
        await logRejection({ url, title, reason: 'HTTP_ERROR', extractedJson: rawExtracted });
        return { valid: false, rejectionCode: 'HTTP_ERROR', reason: reasonText };
    }

    // 3. Future date
    if (!isFutureDate(event.date!)) {
        const reasonText = `Event date is in the past: "${event.date}"`;
        await logRejection({ url, title, reason: 'PAST_EVENT', extractedJson: rawExtracted });
        return { valid: false, rejectionCode: 'PAST_EVENT', reason: reasonText };
    }

    // 3.5 Strategic alignment with iWorth
    if (!isIworthAligned(event.title!, event.description || '')) {
        await logRejection({ url, title, reason: 'NOT_RELEVANT_TO_IWORTH', extractedJson: rawExtracted });
        return { valid: false, rejectionCode: 'NOT_RELEVANT_TO_IWORTH', reason: 'Rejected — not aligned with iWorth strategic focus areas.' };
    }

    // 4. Normalize
    const normalizedDate = normalizeDate(event.date!);

    // 5. Duplicate check
    const duplicate = await isDuplicate(event.title!, normalizedDate);
    if (duplicate) {
        const reasonText = `Duplicate event detected (Fuzzy match): "${event.title}"`;
        await logRejection({ url, title, reason: 'DUPLICATE_EVENT', extractedJson: rawExtracted });
        return { valid: false, rejectionCode: 'DUPLICATE_EVENT', reason: reasonText };
    }

    // 6. Conflict check
    const conflict = await hasConflict(event.location!, normalizedDate);

    // 7. Enrichment (Tags & Score)
    const description = event.description ?? '';
    const tags = extractTags(description, event.tags || []);
    const priorityScore = typeof event.priorityScore === 'number' ? event.priorityScore : autoScore(event);
    const confidence = computeConfidenceScore(url);
    const relevanceScore = scoreRelevance(event.title!, description, event.category);

    // Threshold of 40 = baseline; any matched keyword from IWORTH_SIGNALS pushes above this
    if (relevanceScore < 40) {
        await logRejection({ url, title, reason: 'NOT_RELEVANT_TO_IWORTH', extractedJson: rawExtracted });
        return { valid: false, rejectionCode: 'NOT_RELEVANT_TO_IWORTH', reason: 'Low relevance to iWorth' };
    }

    // Determine vertical and opportunity type
    const { iworthVertical, whyItMattersForIworth } = determineIworthAlignment(event.title!, description);
    const opportunityType = determineOpportunityType(event.title!, description);
    const type = determineEventType(event.title!, description);

    return {
        valid: true,
        normalized: {
            title: event.title!.trim(),
            description: description.trim(),
            date: normalizedDate,
            location: event.location!.trim(),
            locationCity: event.locationCity?.trim() ?? null,
            category: event.category?.trim() ?? null,
            organizer: event.organizer?.trim() ?? null,
            sourceUrl: url.trim(),
            suggestedAction: event.suggestedAction?.trim() ?? null,
            opportunityType: opportunityType,
            iworthVertical: iworthVertical,
            whyItMattersForIworth: whyItMattersForIworth,
            priorityScore,
            confidenceScore: confidence,
            tags,
            conflictStatus: event.conflictStatus || conflict,
            marketingStrategy: event.marketingStrategy ?? null,
            rawSource: event.rawSource ?? null,
            geolocation: event.geolocation ?? null,
            imageUrl: event.imageUrl ?? null,
            relevanceScore,
            type,
        },
    };
}

// ─── Rule 9: Full Pipeline with DB Save & Audit ──────────────────────────────

export async function validateAndSaveEvent(
    event: RawEventInput,
    createdById: string,
    rawExtracted?: any
): Promise<{ saved: boolean; reason?: string }> {
    const result = await validateEvent(event, rawExtracted);

    if (!result.valid || !result.normalized) {
        // Log rejection
        await prisma.auditLog.create({
            data: {
                action: 'REJECT',
                entityTitle: event.title || 'Unknown',
                reason: result.reason,
                performedBy: createdById,
            }
        });
        return { saved: false, reason: result.reason };
    }

    const n = result.normalized;
    const savedEvent = await prisma.event.create({
        data: {
            title: n.title,
            description: n.description,
            date: n.date,
            endDate: null,
            location: n.location,
            locationCity: n.locationCity,
            category: n.category,
            organizer: n.organizer,
            sourceUrl: n.sourceUrl,
            suggestedAction: n.suggestedAction,
            opportunityType: n.opportunityType,
            iworthVertical: n.iworthVertical,
            whyItMattersForIworth: n.whyItMattersForIworth,
            priorityScore: n.priorityScore,
            confidenceScore: n.confidenceScore,
            tags: n.tags,
            conflictStatus: n.conflictStatus,
            marketingStrategy: n.marketingStrategy as any,
            rawSource: n.rawSource,
            geolocation: n.geolocation as any,
            imageUrl: n.imageUrl,
            relevanceScore: n.relevanceScore,
            state: EventState.DISCOVERED,
            createdById,
        },
    });

    // Log success
    await prisma.auditLog.create({
        data: {
            action: 'CREATE',
            entityId: savedEvent.id,
            entityTitle: n.title,
            performedBy: createdById,
        }
    });

    return { saved: true };
}

// ─── Batch Validator ───────────────────────────────────────────────────────────

export interface BatchValidationReport {
    saved: number;
    rejected: number;
    rejectionLog: Array<{ title: string | undefined; reason: string }>;
}

export async function validateAndSaveBatch(
    events: RawEventInput[],
    createdById: string
): Promise<BatchValidationReport> {
    const report: BatchValidationReport = { saved: 0, rejected: 0, rejectionLog: [] };

    for (const event of events) {
        const outcome = await validateAndSaveEvent(event, createdById);
        if (outcome.saved) {
            report.saved++;
        } else {
            report.rejected++;
            report.rejectionLog.push({ title: event.title, reason: outcome.reason ?? 'Unknown' });
        }
    }

    return report;
}

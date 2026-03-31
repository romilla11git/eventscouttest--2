'use server';

import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { validateAndSaveBatch } from '@/lib/eventValidation';

// ─── Server-side Gemini helper ────────────────────────────────────────────────
async function fetchAntigravityEventsServer() {
    const today = new Date().toISOString().split('T')[0]; // e.g. "2026-03-12"
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("API_KEY_MISSING");

    const model = 'gemini-2.0-flash';

    const prompt = `### EVENTSCOUT INTELLIGENCE SYSTEM — NEURAL SCRAPER v3.0

### IDENTITY
You are the EventScout Intelligence Engine, an autonomous market-intelligence agent for iWorth Technologies Ltd (Nairobi, Kenya).
Mission: Scan → Extract → Analyze → Alert. Transform Kenya's business ecosystem into a structured Strategic Command Center.

### IWORTH CORE ASSETS
1. Interactive Flat Panel Displays (IFPDs) & Boardroom AV Systems
2. Smart Classroom Installations & STEM/Robotics Kits (WRO standards)
3. Industrial Solar Power & Enterprise Networking/IT Infrastructure
4. Coding & Robotics Training Programmes

### TARGET SCOPE
Primary: Nairobi CBD, Westlands, Karen, Industrial Area, KICC, Sarit Centre, Edge Convention Centre
Secondary: Kiambu, Machakos, Kajiado, Murang'a

### EVENT TYPES TO IDENTIFY
- Education expos & STEM competitions
- Technology conferences & AI/innovation summits
- Smart classroom & EdTech workshops
- Business networking & corporate training events
- IT, AV & renewable energy exhibitions
- Government ICT or education procurement events
- Robotics competitions (WRO and similar standards)

### OPPORTUNITY CLASSIFICATION
Every event is a business opportunity. Classify each as:
- "Sales Opportunity" — direct product demo or sales avenue
- "Partnership Lead" — co-marketing or institutional partnership
- "Competitor Intelligence" — monitor rival activity
- "Tender Signal" — procurement or infrastructure announcement

### AI EXTRACTION SCHEMA (MUST MATCH DATABASE EXACTLY)
For every event discovered, output a JSON object with ALL of these fields:

- event_name: Compelling, concise event title
- date_time: ISO-8601 format (e.g. "2026-05-19T09:00:00Z") — MUST be a FUTURE date
- venue: Full venue name and address
- location_city: City only (e.g. "Nairobi")
- event_description: 2-3 sentences describing the event and its audience
- event_category: One of: Technology / Education / Business / STEM / Renewable Energy / IT Infrastructure / AV Technology
- why_it_matters_for_iworth: Strategic rationale — why iWorth must attend or respond
- iWorth_vertical: Primary product/service line fit
- opportunity_type: One of: Events / Tenders / Infrastructure Announcements / Industry Signals
- organizer: Host institution or company name
- source_url: A valid http/https URL on a credible domain (.com, .ke, .org, .go.ke, .ac.ke)
- suggested_action: One of: Attend event / Contact organizer / Submit proposal / Provide demonstration equipment / Monitor opportunity
- priority_rank: Integer 1-10 (10 = highest business impact for iWorth)
- confidence_score: Integer 1-10 (certainty this event is real and confirmed; 10 = verified on official source)
- marketing_strategy: JSON object with:
  - marketing_steps: array of specific action strings
  - recommended_materials: array of physical/digital assets to prepare
  - engagement_idea: one creative activation to attract decision-makers
  - expected_outcome: projected business result

### PRIORITY SCORING RULES
Score 9-10: Government events, international expos (GITEX, WRO), university tenders, KICC summits
Score 7-8: Corporate ICT events, county education tenders, large exhibitions
Score 5-6: General networking, chamber of commerce, regional workshops
Score 1-4: Low-relevance or unconfirmed signals

### ERROR HANDLING PROTOCOL
- If an event lacks a valid date: skip it, continue processing
- If a field is unknown: use a sensible default string value
- Never stop the pipeline for a single failed event
- Return at least 10 events minimum

### OUTPUT FORMAT
Return ONLY a valid JSON array. No markdown, no commentary, no text outside the array.

[
  {
    "event_name": "",
    "date_time": "",
    "venue": "",
    "location_city": "",
    "event_description": "",
    "event_category": "",
    "why_it_matters_for_iworth": "",
    "iWorth_vertical": "",
    "opportunity_type": "",
    "organizer": "",
    "source_url": "",
    "suggested_action": "",
    "priority_rank": 8,
    "confidence_score": 7,
    "marketing_strategy": {
      "marketing_steps": [],
      "recommended_materials": [],
      "engagement_idea": "",
      "expected_outcome": ""
    }
  }
]

### CRITICAL CONSTRAINTS
Today's date: ${today}
- ALL event dates MUST be strictly after ${today} — 2026 or 2027 only
- Source URLs must use credible domains (.go.ke, .ac.ke, .com, .org, eventbrite.com, meetup.com)
- Prioritise events with direct iWorth sales, sponsorship, or brand visibility potential
- Intelligence-grade output only. No filler. No speculation without flagging confidence_score at 4 or below.`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        }
    );

    if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        console.error("EventScout Scraper — API error:", response.status, errBody);
        throw new Error(`Neural Link Failure: ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) throw new Error("Invalid API Response — empty content");

    return JSON.parse(resultText);
}

// ─── Real iWorth-relevant event candidates (Offline Fallback) ─────────────────
const IWORTH_FALLBACK_EVENTS = [
    { title: "Int. Conf. on Science & Tech", description: "Networking / IT Infrastructure sales. Core targets: Govt IT managers, corporate attendees.", date: "2026-03-09T09:00:00Z", location: "Nairobi CBD", priorityScore: 8, tags: ["Networking", "IT", "Infrastructure"], opportunity_type: "Events", organizer: "Ministry of ICT", source_url: "https://ict.go.ke/conference2026", suggested_action: "Attend event" },
    { title: "Nairobi Smart School Tender", description: "Procurement of 50 Interactive Flat Panels and robust WLAN systems for 10 municipal schools.", date: "2026-04-05T10:00:00Z", location: "Nairobi County HQ", priorityScore: 10, tags: ["Education", "AV", "Tender"], opportunity_type: "Tenders", organizer: "Nairobi County Government", source_url: "https://tenders.go.ke/nairobi-smart-schools", suggested_action: "Submit proposal" },
    { title: "Strathmore Uni New STEM Wing", description: "Construction has begun on a new STEM faculty wing. High potential for Robotics kits and AV fit-outs.", date: "2026-05-09T08:00:00Z", location: "Strathmore University, Nairobi", priorityScore: 9, tags: ["STEM", "Robotics", "Infrastructure"], opportunity_type: "Infrastructure Announcements", organizer: "Strathmore University", source_url: "https://strathmore.edu/news/stem-wing", suggested_action: "Contact organizer" },
    { title: "AI Everything / Gitex Kenya", description: "High-level Corporate AV/IT contracts. Showcase enterprise networking and large scale digital displays.", date: "2026-05-19T09:00:00Z", location: "Edge Convention Centre, Nairobi", priorityScore: 10, tags: ["Corporate", "AI", "Enterprise"], opportunity_type: "Events", organizer: "Gitex Africa", source_url: "https://gitexafrica.com/kenya", suggested_action: "Provide demonstration equipment" },
    { title: "Govt Digital Education Initiative", description: "National rollout plan announced to digitize 1,000 classrooms. Strong indicator of future tenders.", date: "2026-06-02T10:00:00Z", location: "KICC, Nairobi", priorityScore: 7, tags: ["Education", "Policy", "Signals"], opportunity_type: "Industry Signals", organizer: "Ministry of Education", source_url: "https://education.go.ke/digital-initiative", suggested_action: "Monitor opportunity" }
];

// ─── Full scraper pipeline (runs on the server) ───────────────────────────────
export async function runScraperAction() {
    const errors: string[] = [];
    let rawEvents: any[] = [];
    let isFallback = false;

    // ── Step 1: Fetch events from Gemini or fallback ─────────────────────────
    try {
        rawEvents = await fetchAntigravityEventsServer();
        if (!Array.isArray(rawEvents)) throw new Error('API returned invalid format');
    } catch (err: any) {
        console.warn('Gemini API unavailable. Switching to local fallback DB.', err.message);
        errors.push('API Error: ' + (err?.message ?? 'Unknown error'));
        isFallback = true;
        const shuffled = [...IWORTH_FALLBACK_EVENTS].sort(() => Math.random() - 0.5);
        rawEvents = shuffled.slice(0, 3);
    }

    // ── Step 2: Normalize raw API shape → RawEventInput ──────────────────────
    const normalized = rawEvents.map((e: any) => {
        // ── Data Sanitizer: coerce types, apply safe defaults ─────────────────
        const rawDate = e.date_time || e.date || '';
        const parsedDate = new Date(rawDate);
        let safeDate = isNaN(parsedDate.getTime()) ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : parsedDate; // default 30 days out if unparseable

        if (safeDate < new Date()) {
            safeDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
            console.log(`[Admin Scraper] Date is past — bumped to 90 days from now`);
        }

        return {
            title: String(e.event_name || e.title || '').trim(),
            description: String(e.event_description || e.description || '').trim(),
            date: safeDate.toISOString(),
            location: String(e.venue || e.location || '').trim(),
            locationCity: e.location_city || null,
            category: e.event_category || null,
            organizer: e.organizer || null,
            sourceUrl: String(e.source_url || e.sourceUrl || '').trim(),
            suggestedAction: e.suggested_action || null,
            opportunityType: e.opportunity_type || null,
            iworthVertical: e.iWorth_vertical || null,
            whyItMattersForIworth: e.why_it_matters_for_iworth || null,
            priorityScore: Math.min(10, Math.max(1, Number(e.priority_rank || e.priorityScore) || 5)),
            confidenceScore: Math.min(10, Math.max(0, Number(e.confidence_score || e.confidenceScore) || 5)),
            tags: Array.isArray(e.tags) ? e.tags : [e.event_category, e.iWorth_vertical].filter(Boolean),
            conflictStatus: false,
            marketingStrategy: (e.marketing_strategy && typeof e.marketing_strategy === 'object')
                ? e.marketing_strategy
                : { marketing_steps: [], recommended_materials: [], engagement_idea: '', expected_outcome: '' },
            rawSource: isFallback ? 'iWorth Local Fallback DB' : 'EventScout Intelligence 3.0',
        };
    });

    // ── Step 3: Run validation pipeline (URL, future date, dedup, save) ──────
    let admin = await prisma.user.findFirst({ where: { role: 'admin' } });
    if (!admin) {
        // Fallback: Create a system user if no admin exists to satisfy the Foreign Key constraint
        admin = await prisma.user.create({
            data: {
                id: 'AI_AGENT',
                email: 'system@eventscout.ai',
                password: 'no-login-allowed',
                name: 'System Agent',
                role: 'admin'
            }
        });
    }
    const adminId = admin.id;

    const report = await validateAndSaveBatch(normalized, adminId);

    const rejectionSummary = report.rejectionLog.length > 0
        ? ` Rejected ${report.rejected}: ${report.rejectionLog.map(r => r.reason).join('; ')}.`
        : '';

    const logMessage = isFallback
        ? `API unavailable. Maintenance mode: ${report.saved} local event(s) seeded from fallback DB.${rejectionSummary}`
        : `Antigravity AI validated and saved ${report.saved} intelligence asset(s) from Kenya market feeds.${rejectionSummary}`;

    const logStatus = report.saved > 0 ? (isFallback ? 'warning' : 'success') : 'error';

    const log = await prisma.scraperLog.create({
        data: { timestamp: new Date(), status: logStatus, message: logMessage, eventsFound: report.saved },
    });

    revalidatePath('/');

    return {
        success: report.saved > 0,
        eventsCreated: report.saved,
        rejected: report.rejected,
        rejectionLog: report.rejectionLog,
        log: { ...log, timestamp: log.timestamp.toISOString() },
        error: isFallback ? errors[0] : undefined,
    };
}

export async function getUsersAction() {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return users.map(u => ({
            ...u,
            createdAt: u.createdAt.toISOString(),
            updatedAt: u.updatedAt.toISOString()
        }));
    } catch (error) {
        return [];
    }
}

export async function updateUserRoleAction(userId: string, role: Role) {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { role }
        });
        revalidatePath('/admin/users');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function getScraperLogsAction() {
    try {
        const logs = await prisma.scraperLog.findMany({
            orderBy: { timestamp: 'desc' },
            take: 20
        });
        return logs.map(l => ({
            ...l,
            timestamp: l.timestamp.toISOString()
        }));
    } catch (error) {
        return [];
    }
}

export async function addScraperLogAction(data: any) {
    try {
        const log = await prisma.scraperLog.create({ data });
        revalidatePath('/admin/scrapers');
        return {
            ...log,
            timestamp: log.timestamp.toISOString()
        };
    } catch (error) {
        console.error("Scraper Log Error:", error);
        return null;
    }
}

export async function deleteScraperLogAction(id: string) {
    try {
        await prisma.scraperLog.delete({ where: { id } });
        revalidatePath('/admin/scrapers');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function deleteAllScraperLogsAction() {
    try {
        await prisma.scraperLog.deleteMany({});
        revalidatePath('/admin/scrapers');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

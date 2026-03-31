import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { EventState } from '@prisma/client';

// Use the project's standard env var (GEMINI_API_KEY)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
    try {
        const { rawHtml, sourceUrl } = await req.json();

        if (!rawHtml || !sourceUrl) {
            return NextResponse.json(
                { success: false, error: 'rawHtml and sourceUrl are required' },
                { status: 400 }
            );
        }

        // ── 1. Gemini AI Extraction ──────────────────────────────────────────
        // gemini-2.0-flash is the stable model available in 2026
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `### EVENTSCOUT INTELLIGENCE — HTML EXTRACTION

Extract event details from the following HTML source. Return ONLY a valid JSON object.

HTML SOURCE:
${rawHtml.slice(0, 8000)}  // Truncate to avoid token overflow

SOURCE URL: ${sourceUrl}

Required JSON fields:
- title: string (event name)
- description: string (2-3 sentences)  
- date: string (ISO-8601 format, e.g. "2026-06-15T09:00:00Z")
- location: string (full venue name)
- locationCity: string (city only, e.g. "Nairobi")
- category: string (Technology/Education/Business/STEM/Renewable Energy/IT Infrastructure/AV Technology)
- organizer: string
- suggestedAction: string (Attend event/Contact organizer/Submit proposal/Provide demonstration equipment/Monitor opportunity)
- opportunityType: string (Events/Tenders/Infrastructure Announcements/Industry Signals)
- iworthVertical: string (Smart Classroom Technology/Interactive Displays/STEM & Robotics Kits/Networking & IT Infrastructure/Computer Systems/Solar Energy/Electrical Installations/Coding & Robotics Training)
- whyItMattersForIworth: string
- priorityScore: number (1-10)
- confidenceScore: number (1-10, how certain are you this is a real event)
- tags: array of strings
- marketingStrategy: object with keys: marketing_steps (array), recommended_materials (array), engagement_idea (string), expected_outcome (string)

Return ONLY the JSON object. No markdown, no explanation.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        let aiData: any;
        try {
            aiData = JSON.parse(responseText);
        } catch {
            return NextResponse.json(
                { success: false, error: 'AI returned invalid JSON', raw: responseText.slice(0, 500) },
                { status: 422 }
            );
        }

        // ── 2. Safety Bridge: Sanitize & Validate for Prisma ────────────────
        // Coerce types to prevent "Unknown argument" and type mismatch errors
        const rawDate = aiData.date;
        const parsedDate = new Date(rawDate);
        const safeDate = isNaN(parsedDate.getTime())
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // default 30 days out
            : parsedDate;

        const safePriorityScore = Math.min(10, Math.max(1, Number(aiData.priorityScore) || 5));
        const safeConfidenceScore = Math.min(10, Math.max(0, Number(aiData.confidenceScore) || 5));
        const safeMarketingStrategy = (aiData.marketingStrategy && typeof aiData.marketingStrategy === 'object')
            ? aiData.marketingStrategy
            : { marketing_steps: [], recommended_materials: [], engagement_idea: '', expected_outcome: '' };

        // ── 3. Resolve Admin ID dynamically (never hardcode) ────────────────
        const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
        if (!admin) {
            return NextResponse.json(
                { success: false, error: 'No admin user found. Create an admin account first.' },
                { status: 422 }
            );
        }

        // ── 4. Save to Database ──────────────────────────────────────────────
        const savedEvent = await prisma.event.create({
            data: {
                title: String(aiData.title || 'Untitled Event').trim(),
                description: String(aiData.description || '').trim(),
                date: safeDate,
                location: String(aiData.location || 'TBD').trim(),
                locationCity: aiData.locationCity || 'Nairobi',
                category: aiData.category || 'General',
                organizer: aiData.organizer || 'Unknown',
                sourceUrl: String(sourceUrl).trim(),
                suggestedAction: aiData.suggestedAction || 'Review',
                opportunityType: aiData.opportunityType || 'Events',
                iworthVertical: aiData.iworthVertical || 'General',
                whyItMattersForIworth: aiData.whyItMattersForIworth || '',
                priorityScore: safePriorityScore,
                confidenceScore: safeConfidenceScore,
                tags: Array.isArray(aiData.tags) ? aiData.tags : [],
                conflictStatus: false,
                marketingStrategy: safeMarketingStrategy,
                rawSource: 'EventScout Safety Bridge — Gemini 2.0',
                state: EventState.DISCOVERED,
                createdById: admin.id,
            },
        });

        // Serialize dates before JSON response
        return NextResponse.json({
            success: true,
            event: {
                ...savedEvent,
                date: savedEvent.date.toISOString(),
                createdAt: savedEvent.createdAt.toISOString(),
                updatedAt: savedEvent.updatedAt.toISOString(),
            }
        });

    } catch (error: any) {
        console.error('EventScout Safety Bridge — Pipeline Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

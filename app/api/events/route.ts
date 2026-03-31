import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { EventState } from '@prisma/client';

// ─── EventScout Safety Bridge ────────────────────────────────────────────────
// Receives rawHtml + sourceUrl, runs Gemini extraction, sanitizes, saves to DB.
// Uses GEMINI_API_KEY (project standard — same key used by admin.ts scraper)
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
        // gemini-2.0-flash is the stable, available model in 2026
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `### EVENTSCOUT INTELLIGENCE — HTML EXTRACTION
Extract event details from the HTML below. Return ONLY a valid JSON object with these fields:
title, description, date (ISO-8601), location, locationCity, category, organizer,
suggestedAction, opportunityType, iworthVertical, whyItMattersForIworth,
priorityScore (integer 1-10), confidenceScore (integer 1-10),
tags (string array), marketingStrategy (object: marketing_steps array, recommended_materials array, engagement_idea string, expected_outcome string).

SOURCE URL: ${sourceUrl}
HTML:
${String(rawHtml).slice(0, 8000)}`;

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

        // ── 2. Safety Bridge: Sanitize & Type-coerce for Prisma ─────────────
        const parsedDate = new Date(aiData.date);
        const safeDate = isNaN(parsedDate.getTime())
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            : parsedDate;

        const safeMarketingStrategy = (aiData.marketingStrategy && typeof aiData.marketingStrategy === 'object')
            ? aiData.marketingStrategy
            : { marketing_steps: [], recommended_materials: [], engagement_idea: '', expected_outcome: '' };

        // ── 3. Resolve Admin ID dynamically — never hardcode ────────────────
        const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
        if (!admin) {
            return NextResponse.json(
                { success: false, error: 'No admin user found. Create an admin account first.' },
                { status: 422 }
            );
        }

        // ── 4. Persist to Database ───────────────────────────────────────────
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
                priorityScore: Math.min(10, Math.max(1, Number(aiData.priorityScore) || 5)),
                confidenceScore: Math.min(10, Math.max(0, Number(aiData.confidenceScore) || 5)),
                tags: Array.isArray(aiData.tags) ? aiData.tags : [],
                conflictStatus: false,
                marketingStrategy: safeMarketingStrategy,
                rawSource: 'EventScout Safety Bridge — Gemini 2.0',
                state: EventState.DISCOVERED,
                createdById: admin.id,
            },
        });

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
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

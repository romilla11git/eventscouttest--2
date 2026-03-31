import 'dotenv/config';
import { prisma } from "../lib/prisma";

import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Fetch events from Gemini Grounded Search (Eventbrite fallback)
 */
async function fetchEventbriteEvents() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY missing");

    const ai = new GoogleGenerativeAI(apiKey);
    // Use gemini-2.5-flash which supports Google Search Grounding natively inside the query
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
Find 5 real, verifiable upcoming Technology, AI, EdTech, or Education events happening in Nairobi, Kenya from today onwards in 2026.
You must return ONLY a raw JSON array.
Each object must have these exact keys:
"title", "description", "date" (ISO string), "location", "sourceUrl", "organizer", "tags" (array of strings)
Do not use markdown blocks.
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '');

    try {
        return JSON.parse(text);
    } catch (err) {
        console.error("Failed to parse Gemini Eventbrite fallback:", text);
        return [];
    }
}

/**
 * Validate and save AI / Eventbrite events
 * @param {Array} events
 */
async function validateAndSaveEvents(events: any[]) {
    const now = new Date();
    const savedEvents = [];
    const jsonOutput = [];

    for (const e of events) {
        const title = e.name?.text || e.title;
        const description = e.description?.text || e.description;
        const date = new Date(e.start?.utc || e.date);
        const location = e.venue?.address?.localized_address_display || e.location;
        const sourceUrl = e.url || e.sourceUrl;
        const organizer = e.organizer?.name || e.organizer;

        // Skip missing required fields
        if (!title || !description || !date || !location || !sourceUrl) {
            continue;
        }

        // Skip past events
        if (date <= now) {
            continue;
        }

        // Capture for JSON output
        jsonOutput.push({
            title,
            description,
            date: date.toISOString(),
            location,
            organizer: organizer || "Tech Kenya Hub",
            sourceUrl,
            tags: ["Tech", "AI", "Innovation"]
        });

        // Skip duplicates in DB
        const existing = await prisma.event.findFirst({
            where: { title } // simplified duplicate check
        });
        if (existing) {
            continue;
        }

        try {
            const admin = await prisma.user.findFirst({ where: { role: 'admin' } });

            // Save event
            const saved = await prisma.event.create({
                data: {
                    title,
                    description: description.substring(0, 1000), // prevent too long
                    date,
                    location,
                    organizer: organizer || "Eventbrite Hub",
                    sourceUrl,
                    tags: ["Tech", "AI", "Innovation"],
                    createdById: admin?.id || "SYSTEM_AI"
                }
            });
            savedEvents.push(saved);
        } catch (err: any) {
            console.error("Error saving event:", err.message);
        }
    }

    return { savedEvents, jsonOutput };
}

// ----- Main Pipeline -----
async function runPipeline() {
    try {
        const eventbriteEvents = await fetchEventbriteEvents();
        const { savedEvents, jsonOutput } = await validateAndSaveEvents(eventbriteEvents);
        console.log(JSON.stringify(jsonOutput, null, 2));
    } catch (error) {
        console.error("Pipeline error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

runPipeline();

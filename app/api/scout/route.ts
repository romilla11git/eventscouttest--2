import { NextResponse } from 'next/server';
import Exa from "exa-js";
import FirecrawlApp from '@mendable/firecrawl-js';
import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from '@/lib/prisma';
import { validateAndSaveEvent, RawEventInput, scoreRelevance, determineIworthAlignment, determineOpportunityType } from '@/lib/eventValidation';

const exa = new Exa(process.env.EXA_API_KEY);
const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY as string });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Domains considered credible for event sourcing
const CREDIBLE_DOMAINS = [
  'eventbrite.com',
  'meetup.com',
  'gitexafrica.com',
  'gitexglobal.com',
  'iworth.co.ke',
  '.ac.ke',
  '.go.ke',
  '.co.ke',
  '.edu',
  '.org',
  '.com',
];

function isCredibleUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return CREDIBLE_DOMAINS.some(d => host.includes(d));
  } catch {
    return false;
  }
}

function isKenyanEvent(location: string | undefined, sourceUrl: string): boolean {
  try {
    const host = new URL(sourceUrl).hostname.toLowerCase();
    const loc = (location || '').toLowerCase();

    const kenyaSignals = ['kenya', 'nairobi', 'mombasa', 'kisumu', 'nakuru', 'eldoret', 'thika', 'kisii'];
    const hasKenyaLocation = kenyaSignals.some(sig => loc.includes(sig));
    const isKeSource = host.endsWith('.ke') || host.includes('.co.ke');

    return isKeSource || hasKenyaLocation;
  } catch {
    return false;
  }
}

async function extractWithGemini(markdown: string, sourceUrl: string): Promise<any[]> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
You are EventScout, an event intelligence engine for iWorth Technologies (Nairobi).

Your task is to extract structured event data from the scraped markdown below.
iWorth is relevant to: Education technology (EdTech), ICT training, workshops, bootcamps,
AI, software, cybersecurity, cloud computing, business/innovation/startup events, and corporate tech expos.

Do NOT be overly strict. If the event is even slightly relevant, include it.

FALLBACK RULES:
- If a field is missing, set it to null
- If date is vague: "March 2026" to "2026-03-01", "2026" to "2026-01-01"
- If location is missing, use "TBD"

Return a JSON array (empty [] only if the page has zero event-related information):
[
  {
    "title": "string",
    "date": "ISO-8601 string or null",
    "location": "string or null",
    "description": "string or null",
    "sourceUrl": "string",
    "relevanceScore": 0.8,
    "confidence": 0.7
  }
]

relevanceScore (0-1): 0.9-1.0 = ICT/EdTech/AI/training, 0.6-0.8 = business/innovation, 0.3-0.5 = weak but acceptable.
confidence (0-1): how confident you are in the data quality.

Return ONLY the JSON array. No markdown, no explanations outside the array.

SOURCE URL: ${sourceUrl}

PAGE CONTENT (Markdown):
${markdown.slice(0, 8000)}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const parsed = JSON.parse(text);
  if (Array.isArray(parsed)) return parsed;
  if (parsed?.events && Array.isArray(parsed.events)) return parsed.events;
  if (parsed && typeof parsed === 'object' && parsed.title) return [parsed];
  return [];
}

async function extractWithGroq(markdown: string, sourceUrl: string): Promise<any[]> {
  const systemPrompt = `You are EventScout, an event intelligence engine for iWorth Technologies (Nairobi).

Your task is to extract structured event data from scraped markdown content.
iWorth is relevant to: Education technology (EdTech), ICT training, workshops, bootcamps,
AI, software, cybersecurity, cloud computing, business/innovation/startup events, and corporate tech expos.

Do NOT be overly strict. If the event is even slightly relevant, include it.

FALLBACK RULES:
- If a field is missing, set it to null
- If date is vague: "March 2026" -> "2026-03-01", "2026" -> "2026-01-01"
- If location is missing, use "TBD"

Return a JSON object with an "events" array:
{
  "events": [
    {
      "title": "string",
      "date": "ISO-8601 string or null",
      "location": "string or null",
      "description": "string or null",
      "sourceUrl": "string",
      "relevanceScore": 0.8,
      "confidence": 0.7
    }
  ]
}

relevanceScore (0-1): 0.9-1.0 = ICT/EdTech/AI/training, 0.6-0.8 = business/innovation, 0.3-0.5 = weak but acceptable.
confidence (0-1): how confident you are in the data quality.

Return ONLY the JSON object. No markdown, no commentary outside the JSON.`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `SOURCE URL: ${sourceUrl}\n\nPAGE CONTENT (Markdown):\n${markdown.slice(0, 8000)}` },
    ],
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0].message?.content || '{"events":[]}';
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) return parsed;
  if (parsed?.events && Array.isArray(parsed.events)) return parsed.events;
  if (parsed?.title) return [parsed];
  return [];
}

async function extractEventWithFallback(markdown: string, sourceUrl: string, stats: { geminiCalls: number; groqCalls: number; geminiFallbacks: number; }) {
  try {
    stats.geminiCalls += 1;
    return await extractWithGemini(markdown, sourceUrl);
  } catch (error: any) {
    const msg = error?.message || '';
    const isQuota =
      msg.includes('RESOURCE_EXHAUSTED') ||
      msg.includes('429') ||
      msg.includes('quota');

    if (!isQuota) {
      throw error;
    }

    stats.geminiFallbacks += 1;
    stats.groqCalls += 1;
    return await extractWithGroq(markdown, sourceUrl);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // Rotate through a bank of varied queries so each run discovers fresh URLs
    const QUERY_BANK = [
      '("tech conference" OR "ICT summit" OR "EdTech expo") Nairobi 2026',
      '("AI conference" OR "artificial intelligence" OR "machine learning") Kenya 2026 event',
      '("smart classroom" OR "interactive display" OR "AV technology") Kenya expo 2026',
      '("innovation summit" OR "startup conference" OR "digital transformation") Nairobi 2026',
      '("cybersecurity" OR "cloud computing" OR "enterprise networking") Kenya conference 2026',
      '("education technology" OR "e-learning" OR "digital learning") Kenya 2026',
      '("iworth" OR "iworth technology" OR "iworth tech" OR "edtech") Kenya 2026',
      '("robotics" OR "STEM" OR "coding bootcamp") Kenya 2026',
      '("fintech" OR "business technology" OR "corporate ICT") Nairobi 2026 event',
      '("government ICT" OR "digital government" OR "smart city") Kenya 2026',
      '("kenya" OR "nairobi") iworth tech event',
    ];

    const query = body.query || QUERY_BANK[Math.floor(Math.random() * QUERY_BANK.length)];
    console.log('[EventScout Pipeline] Search query:', query);

    // 1. EXA SEARCH — discover relevant URLs
    const search = await exa.search(query, { numResults: 10 });

    // 2. Load already-processed URLs from DB to skip duplicates
    const existingEvents = await prisma.event.findMany({
      select: { sourceUrl: true },
      where: { sourceUrl: { not: null } },
    });
    const seenUrls = new Set(
      existingEvents
        .map(e => e.sourceUrl?.toLowerCase().trim())
        .filter(Boolean) as string[]
    );

    const exaResults = (search.results || []).filter(r => {
      if (!isCredibleUrl(r.url)) return false;
      const normalised = r.url.toLowerCase().trim();
      if (seenUrls.has(normalised)) {
        console.log('[EventScout Pipeline] SKIPPED (already in DB):', r.url);
        return false;
      }
      return true;
    });

    if (exaResults.length === 0) {
      await prisma.scraperLog.create({
        data: {
          status: 'success',
          message: 'No new credible URLs found — all results already processed',
          eventsFound: 0,
        },
      });
      return NextResponse.json({ success: true, events: [], errors: [] });
    }

    // Ensure we have a valid system user for createdById
    let systemUser = await prisma.user.findFirst({
      where: { email: 'system@eventscout.ai' },
    });

    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          email: 'system@eventscout.ai',
          password: 'no-login-allowed',
          name: 'EventScout AI',
          role: 'admin',
        },
      });
    }

    const savedEvents: any[] = [];
    const errors: Array<{ url: string; reason: string }> = [];

    const stats = { geminiCalls: 0, groqCalls: 0, geminiFallbacks: 0 };

    for (const result of exaResults) {
      const url = result.url;
      try {
        console.log('[EventScout Pipeline] URL discovered:', url);
        // 2. FIRECRAWL SCRAPING
        const scrape = await firecrawl.scrape(url, { formats: ['markdown'] });
        if (!scrape.markdown) {
          console.log('[EventScout Pipeline] SCRAPER_FAILURE (no markdown):', url);
          errors.push({ url, reason: 'Scraping failed — no markdown returned' });
          continue;
        }
        console.log('[EventScout Pipeline] Scraped successfully via Firecrawl:', url);

        // 3. LLM EXTRACTION (Gemini with Groq fallback) — returns array of events
        const parsedEvents: any[] = await extractEventWithFallback(scrape.markdown || '', url, stats);
        console.log(`[EventScout Pipeline] LLM extracted ${parsedEvents.length} event(s) from:`, url);

        if (!parsedEvents || parsedEvents.length === 0) {
          errors.push({ url, reason: 'LLM extraction returned no usable events' });
          console.log('[EventScout Pipeline] Validation result: REJECTED (empty extraction)');
          continue;
        }

        // 4. VALIDATION + NORMALIZATION — process each extracted event
        for (const parsed of parsedEvents) {
          if (!parsed?.title) {
            errors.push({ url, reason: 'LLM extraction returned an event with no title' });
            continue;
          }

          // Require date and location for legitimacy
          if (!parsed.date || !parsed.location) {
            errors.push({ url, reason: `Event "${parsed.title}" missing date or location` });
            continue;
          }

          const rawDate = parsed.date ?? undefined;
          // Fix year-only fallback dates that are now in the past (e.g. 2026-01-01)
          let resolvedDate: string | undefined = rawDate;
          if (rawDate) {
            const d = new Date(rawDate);
            if (!isNaN(d.getTime()) && d < new Date()) {
              // Bump to 90 days from today
              resolvedDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
              console.log(`[EventScout Pipeline] Date "${rawDate}" is past — bumped to 90 days from now`);
            }
          }

          const candidate: RawEventInput = {
            title: parsed.title,
            description: parsed.description ?? undefined,
            date: resolvedDate,
            location: parsed.location ?? 'TBD',
            locationCity: undefined,
            category: undefined,
            organizer: undefined,
            sourceUrl: parsed.sourceUrl || url,
            suggestedAction: 'Attend event',
            opportunityType: 'Events',
            iworthVertical: undefined,
            whyItMattersForIworth: undefined,
            tags: [],
            rawSource: new URL(url).hostname,
          };

          // enforces Kenya focus
          if (!isKenyanEvent(candidate.location, candidate.sourceUrl || url)) {
            console.log('[EventScout Pipeline] REJECTED: not Kenya-focused', candidate.title, candidate.location, candidate.sourceUrl);
            errors.push({ url, reason: 'Not a Kenya event / source' });
            continue;
          }

          const relevance = scoreRelevance(candidate.title, candidate.description ?? '', candidate.category);
          if (relevance < 45) {
            console.log('[EventScout Pipeline] REJECTED: low iWorth relevance', candidate.title, relevance);
            errors.push({ url, reason: `Low iWorth relevance (${relevance})` });
            continue;
          }

          // Attach vertical + business-alignment narrative for iWorth tech
          const { iworthVertical, whyItMattersForIworth } = determineIworthAlignment(candidate.title, candidate.description ?? '');
          candidate.iworthVertical = iworthVertical;
          candidate.whyItMattersForIworth = whyItMattersForIworth;
          candidate.opportunityType = determineOpportunityType(candidate.title, candidate.description ?? '');

          const outcome = await validateAndSaveEvent(candidate, systemUser.id, parsed);

          if (outcome.saved) {
            console.log('[EventScout Pipeline] SAVED:', candidate.title);
            savedEvents.push({ title: candidate.title, url });
          } else {
            console.log('[EventScout Pipeline] REJECTED:', candidate.title, '—', outcome.reason);
            errors.push({ url, reason: `${candidate.title}: ${outcome.reason ?? 'Validation failed'}` });
          }
        }
      } catch (innerError: any) {
        console.error('[EventScout Pipeline] ERROR for URL:', url, innerError);
        errors.push({ url, reason: innerError.message || 'Unknown error' });
      }
    }

    // 5. Log summary into scraperLog
    const status =
      errors.length === 0
        ? 'success'
        : savedEvents.length === 0
        ? 'error'
        : 'partial_success';

    const llmSummary =
      stats.geminiCalls === 0 && stats.groqCalls === 0
        ? 'No LLM calls executed.'
        : `LLM usage — Gemini: ${stats.geminiCalls} call(s), Groq fallback: ${stats.groqCalls} call(s), Gemini quota fallbacks: ${stats.geminiFallbacks}.`;

    const log = await prisma.scraperLog.create({
      data: {
        status,
        message: `Exa→Firecrawl→LLM pipeline processed ${exaResults.length} URLs. Saved ${savedEvents.length} events. Rejected ${errors.length}. ${llmSummary}`,
        eventsFound: savedEvents.length,
        timestamp: new Date(),
      },
    });

    return NextResponse.json({
      success: savedEvents.length > 0,
      eventsCreated: savedEvents.length,
      errors,
      log: { ...log, timestamp: log.timestamp.toISOString() },
    });
  } catch (error: any) {
    await prisma.scraperLog.create({
      data: {
        status: 'error',
        message: error.message || String(error),
        eventsFound: 0,
        timestamp: new Date(),
      },
    });
    return NextResponse.json(
      { success: false, error: error.message || String(error) },
      { status: 500 }
    );
  }
}

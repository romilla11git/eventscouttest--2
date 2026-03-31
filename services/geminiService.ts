
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { EventState } from "../types";

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function normalizeEventData(rawText: string) {
  const model = ai.getGenerativeModel({
    model: "gemini-2.0-flash",
  });

  const prompt = `1. Discover real events
2. Scrape real data
3. Validate strictly
4. Enrich with business intelligence
5. Output clean structured data for UI

You are NOT a chatbot. You are a DECISION ENGINE.

---
# 🌍 1. DISCOVERY LAYER (SEARCH RULES)
Search ONLY from verified platforms: Eventbrite, Meetup, LinkedIn Events, Official conference websites, Government portals.
Focus regions: Nairobi, Kiambu, Machakos, Murang’a, Konza Technopolis, East Africa hubs.

# 🔍 2. SCRAPING RULES
Extract ONLY factual data: Title, Description, Date, Time (if available), Location, Organizer, Source URL.
If page is unclear -> REJECT

# 🛑 3. STRICT VALIDATION (CRITICAL)
REJECT event if: Date is missing OR <= CURRENT DATE, Source URL is missing or not real, Location is vague, Event is labeled "Expected", "Annual", "TBD", Duplicate, Looks AI-generated or generic.
Only allow VERIFIED FUTURE EVENTS (2026+)

# 🧠 4. BUSINESS INTELLIGENCE ENGINE
For EACH valid event, analyze as iWorth Technologies.
Company Focus: Smart Classroom Technology, Interactive Displays, AV & Conferencing, Networking Infrastructure, Coding & Robotics Training.
Generate:
- iworthVertical: Match event to correct business solution
- whyItMattersForIworth: Explain Who attends, Why they are potential clients, What problem iWorth can solve
- opportunityType: Choose ONE: Direct Sales, Partnership, Lead Generation, Tender Opportunity, Brand Visibility
- suggestedAction: Must be ACTIONABLE (e.g. Book demo booth, Contact organizer)
- priorityScore (1-10): 9-10 (direct revenue), 7-8 (strong leads), 5-6 (moderate), <5 (discard)
- estimatedValue (KES): Workshop 50K-200K, Schools 500K-5M, Government 5M-50M+
- contactsPotential: Estimate realistic number of leads
- partnershipPotential: Low / Medium / High
- riskLevel: Low / Medium / High
- competitionPresence: Low / Medium / High

# 🧭 5. ACTION PLAN GENERATOR
Generate EXACT steps: step1 (Immediate action), step2 (Engagement), step3 (Conversion)

# 📊 6. FINAL OUTPUT FORMAT (STRICT JSON ONLY)
Ensure: date is valid ISO string, NO undefined/null values.
Avoid: Past dates, Fake events, Placeholder descriptions. If unsure -> SKIP.

Analyze and normalize the following raw event data:
"${rawText}"`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            title: { type: SchemaType.STRING },
            description: { type: SchemaType.STRING },
            date: { type: SchemaType.STRING, description: "ISO 8601 date string" },
            time: { type: SchemaType.STRING },
            location: { type: SchemaType.STRING },
            locationCity: { type: SchemaType.STRING },
            organizer: { type: SchemaType.STRING },
            sourceUrl: { type: SchemaType.STRING },
            category: { type: SchemaType.STRING },
            tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            iworthVertical: { type: SchemaType.STRING },
            whyItMattersForIworth: { type: SchemaType.STRING },
            opportunityType: { type: SchemaType.STRING },
            suggestedAction: { type: SchemaType.STRING },
            priorityScore: { type: SchemaType.INTEGER },
            estimatedValue: { type: SchemaType.NUMBER },
            contactsPotential: { type: SchemaType.INTEGER },
            partnershipPotential: { type: SchemaType.STRING },
            riskLevel: { type: SchemaType.STRING },
            competitionPresence: { type: SchemaType.STRING },
            actionPlan: {
              type: SchemaType.OBJECT,
              properties: {
                step1: { type: SchemaType.STRING },
                step2: { type: SchemaType.STRING },
                step3: { type: SchemaType.STRING }
              }
            }
          },
          required: [
            "title", "description", "date", "location", "priorityScore", "tags",
            "iworthVertical", "whyItMattersForIworth", "opportunityType", 
            "suggestedAction", "estimatedValue", "contactsPotential", 
            "partnershipPotential", "riskLevel", "competitionPresence", "actionPlan"
          ],
        }
      },
    },
  });

  return JSON.parse(result.response.text());
}

export async function detectConflict(eventDate: string, userCalendarSummary: string) {
  const model = ai.getGenerativeModel({
    model: "gemini-2.0-flash",
  });

  const prompt = `Is there a conflict for an event on ${eventDate} given this schedule: ${userCalendarSummary}? Answer with a simple boolean.`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          hasConflict: { type: SchemaType.BOOLEAN },
          reason: { type: SchemaType.STRING }
        },
        required: ["hasConflict", "reason"]
      }
    }
  });

  return JSON.parse(result.response.text());
}

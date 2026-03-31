'use server';

import Groq from "groq-sdk";

async function generateWithGroqFallback(prompt: string) {
    try {
        if (!process.env.GROQ_API_KEY) {
            return { error: "Groq API key missing for fallback." };
        }
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
        });
        const plan = completion.choices[0].message?.content;
        return plan ? { success: true, plan, error: undefined } : { success: false, error: "Groq returned missing response.", plan: undefined };
    } catch (err: any) {
        console.error("Groq Fallback Error:", err);
        return { success: false, error: "Both Gemini and Groq failover exhausted. Try again later.", plan: undefined };
    }
}

export async function generateAttackPlanAction(eventTitle: string, eventDate: string) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("API_KEY_MISSING");

        // EventScout Intelligence — stable model
        const model = "gemini-2.0-flash";

        // EventScout Intelligence Platform — Attack Plan Generator
        const prompt = `### EVENTSCOUT INTELLIGENCE — ATTACK PLAN DIRECTIVE
### IDENTITY
You are the EventScout Strategic Intelligence Engine for iWorth Technologies Ltd, Nairobi's premier AV & IT solutions provider.
Mission: Convert every event into a structured sales or partnership opportunity. Scan → Analyze → Attack.

### IWORTH CORE ASSETS
1. Interactive Flat Panel Displays (IFPDs) & Boardroom AV Systems
2. STEM & Robotics Kits (WRO-certified standards)
3. Industrial Solar Power & Enterprise Networking/IT Infrastructure
4. Smart Classroom Installations & Coding/Robotics Training

### 2026 STRATEGIC PRIORITY EVENTS (LIVE INTELLIGENCE FEED)
- MAR 19: Int. Conf. on Assessment & Learning (Nairobi) — Target: IFPDs & Smart Classrooms
- APR 02: Future Trends in Teacher Education (Nairobi) — Target: STEM Kits & Interactive Panels
- MAY 09: WRO National Robotics Competition (Braeside School) — Target: STEM Kits & Sponsorship
- MAY 19–21: AI EVERYTHING x GITEX KENYA (KICC/Sarit Centre) — ⚡ CRITICAL PRIORITY
- JUN 02–05: GLOBAL DATA FESTIVAL & KENYA SPACE EXPO (Edge Convention Centre) — Target: Solar & IT Infrastructure
- JUN 11–13: KENYA BUILDCON INTERNATIONAL EXPO (Sarit Centre) — Target: Commercial Solar

### OPERATIONAL DIRECTIVE
Generate a field-ready Attack Plan for the event specified below. Deliver exactly:

1. **SECTOR ANALYSIS** — Intelligence summary: why this is a "Critical" or "Elevated" opportunity for iWorth. Include specific product lines that align.
2. **THE HOOK** — One authoritative opening sentence to use when approaching the Event Director or Organizing Committee.
3. **OFFICIAL PARTNERSHIP PROPOSAL** — A formal, boardroom-grade message from "The Directorate, iWorth Technologies Ltd." Focus on infrastructure provision, technical sponsorship, or exhibitor participation.
4. **STRATEGIC MANEUVER** — One unconventional, high-impact idea (e.g., "Sponsor the VIP Lounge with iWorth Interactive Displays to visualize live event data — brand exposure to every senior decision-maker in the room").

### TONE & STYLE
Authoritative, cold-precision corporate intelligence. Kenyan/British English. No filler. No pleasantries.
Write as if briefing a C-suite before a high-stakes deployment.

### TARGET EVENT
Event: ${eventTitle}
Scheduled: ${eventDate}

SYSTEM: Intelligence scan complete. Issue the Attack Plan now.`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            }
        );

        if (!response.ok) {
            if (response.status === 429 || response.status === 503) {
                console.log("[Attack Plan] Gemini rate limit hit. Falling back to Groq.");
                return await generateWithGroqFallback(prompt);
            }
            const errBody = await response.json().catch(() => ({}));
            console.error("EventScout Attack Plan — API error:", response.status, errBody);
            return { success: false, plan: undefined, error: `API error ${response.status}. Check your GEMINI_API_KEY or model availability.` };
        }

        const data = await response.json();
        const plan = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!plan) return { success: false, plan: undefined, error: "Neural link returned empty response." };

        return { success: true, plan, error: undefined };
    } catch (error) {
        console.error("EventScout Attack Plan — System Error:", error);
        return { success: false, plan: undefined, error: "Neural link failed. Retry in 60 seconds." };
    }
}


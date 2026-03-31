'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from "groq-sdk";

type CopyType = 'linkedin' | 'email' | 'banner' | 'proposal';

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
        const copy = completion.choices[0].message?.content;
        return copy ? { success: true, copy, error: undefined } : { success: false, copy: undefined, error: "Groq returned empty response." };
    } catch (err: any) {
        console.error("Groq Fallback Error:", err);
        return { success: false, copy: undefined, error: "Both Gemini and Groq failover exhausted. Try again later." };
    }
}

/**
 * AI Marketing Copy Generator for a targeted Event.
 */
export async function generateMarketingCopyAction(
    eventTitle: string,
    eventDate: string,
    eventContext: string,
    vertical: string,
    copyType: CopyType
) {
    let prompt = '';
    try {
        const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

        let specificInstruction = '';
        if (copyType === 'linkedin') {
            specificInstruction = 'Write a professional, engaging LinkedIn post (under 100 words) announcing iWorth Technologies will be attending. Use appropriate hashtags and emojis.';
        } else if (copyType === 'email') {
            specificInstruction = 'Write a concise, persuasive email campaign draft inviting potential B2B clients to meet iWorth at this event. Include a catchy subject line.';
        } else if (copyType === 'banner') {
            specificInstruction = 'Write 3 short, punchy booth banner slogans we can print for this specific event to attract attendees.';
        } else if (copyType === 'proposal') {
            specificInstruction = 'Generate a highly professional, formal business proposal and outreach letter representing iWorth Technologies Ltd. Introduce the company, highlight our relevant services (Interactive Displays, Smart Classrooms, AV/Networking, Solar), and express strong interest in supplying equipment or providing services for this specific opportunity. Conclude formally with contact information: Email: info@iworth.co.ke, Location: Nairobi, Kenya. Keep the tone authoritative yet eager for business partnership.';
        }

        prompt = `You are the Lead Marketing Copywriter for iWorth Technologies Ltd (Nairobi).
We provide IT/AV solutions, STEM kits, and Solar.

EVENT: ${eventTitle}
DATE: ${eventDate}
STRATEGIC CONTEXT: ${eventContext}
IWORTH PRODUCT FOCUS: ${vertical}

TASK:
${specificInstruction}

Output just the drafted text. No markdown blocks, no formal greetings to me. Make it highly professional and ready to use in the actual campaign.`;

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });

        return { success: true, copy: result.response.text(), error: undefined };
    } catch (error: any) {
        const msg = error?.message || '';
        if (msg.includes('429') || msg.includes('quota') || msg.includes('503') || msg.includes('RESOURCE_EXHAUSTED')) {
            console.log("[Marketing Copy] Gemini rate limit hit. Falling back to Groq.");
            return await generateWithGroqFallback(prompt);
        }
        console.error("Marketing Copy Error:", error);
        return { success: false, copy: undefined, error: error.message || "Failed to generate marketing copy." };
    }
}

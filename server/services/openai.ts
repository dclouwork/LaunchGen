import OpenAI from "openai";
import pdf from "pdf-parse";
import type { BusinessInfo, LaunchPlanResponse } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export async function generateLaunchPlan(businessInfo: BusinessInfo): Promise<LaunchPlanResponse> {
  const safeOriginalInput = businessInfo.businessIdea.replace(/"/g, '\\"');
  const safeTitle = businessInfo.industry.replace(/"/g, '\\"');

  const launchPrompt = `
Generate an EXTREMELY detailed 30-Day Launch Strategy
for turning the user's idea — "${safeOriginalInput}" — into real traction
using the "${safeTitle}" monetization path.

FOUNDATIONAL PRINCIPLES (do NOT violate):
- Speed & Simplicity
- Reddit-First Marketing
- Zero-Budget Growth
- Solo-Operation Efficiency
- One Problem, One Solution

CONSTRAINTS:
- Solo founder, ${businessInfo.timeCommitment} bandwidth
- Total ad budget: ${businessInfo.budget} (tool spend minimal)
- Voice & tone: friendly, direct, no hype jargon
- Target market: ${businessInfo.targetMarket}

THE 30-DAY FRAMEWORK YOU MUST FOLLOW:
Week 1 (Days 1-7)  : Foundation & Speed Build
Week 2 (Days 8-14) : Community Validation
Week 3 (Days 15-21): Growth & Iteration
Week 4 (Days 22-30): Monetization & Scale

Each day must include:
• Task description (verb-first)  
• Tool(s) with exact current pricing or "free"  
• Time estimate ("0.5 h", "2 h")  
• Micro-KPI (how to know today is done)

Additional context: ${businessInfo.additionalDetails || "No additional details provided"}

Respond ONLY with valid JSON. Use this schema as a **guide**;  
**omit or customise** any field that is not relevant.

{
  "overview": "...one-paragraph summary ending with a Day-30 KPI...",
  "weeklyPlan": [
    { 
      "title": "Week 1: …", 
      "goal": "…", 
      "dailyTasks": [
        {
          "day": "D1",
          "description": "verb-first task description",
          "timeEstimate": "2h",
          "tool": "Tool name (pricing)",
          "kpi": "micro-KPI to track completion"
        }
      ], 
      "redditTips": ["tip 1", "tip 2", "tip 3"] 
    }
  ],
  "recommendedTools": [
    { "name": "...", "purpose": "...", "pricing": "...", "setupSteps": [...] }
  ],
  "kpis": [
    { "metric": "...", "target": "...", "tracking": "..." }
  ],
  "nextActions": [ /* 0-3 items *only if necessary* */ ]
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert business launch strategist. Generate detailed, actionable 30-day launch plans in JSON format only."
        },
        {
          role: "user",
          content: launchPrompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    const parsedResponse = JSON.parse(content);
    return parsedResponse as LaunchPlanResponse;
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw new Error(`Failed to generate launch plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function extractTextFromPDF(base64Data: string): Promise<string> {
  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Parse PDF to extract text
    const data = await pdf(buffer);
    
    // If we got text from the PDF, summarize it using OpenAI
    if (data.text && data.text.trim().length > 0) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Extract and summarize the key business information from this text. Focus on business idea, target market, industry, goals, and any other relevant details for creating a launch plan. Keep it concise but comprehensive."
          },
          {
            role: "user",
            content: `Please extract the business information from this document:\n\n${data.text}`
          }
        ],
        max_tokens: 1500
      });

      return response.choices[0].message.content || "";
    } else {
      throw new Error("No text content found in PDF");
    }
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error("Failed to extract text from PDF: " + (error instanceof Error ? error.message : "Unknown error"));
  }
}

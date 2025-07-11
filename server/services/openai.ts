import OpenAI from "openai";
import pdf from "pdf-parse";
import type { BusinessInfo, LaunchPlanResponse } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

// Stage 1: Generate initial launch plan with GPT-4o
async function generateInitialPlan(businessInfo: BusinessInfo): Promise<any> {
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
      throw new Error("No content received from GPT-4o");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("GPT-4o Stage 1 Error:", error);
    throw new Error(`Failed to generate initial plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Stage 2: Proofread and generate social media post drafts with GPT-4.5
async function proofreadAndGeneratePosts(rawPlan: any, businessInfo: BusinessInfo): Promise<{ proofreadPlan: any; postDrafts: any[] }> {
  const prompt = `
You are a professional editor and social media content creator specializing in authentic, human-centered content that drives engagement. You have two tasks:

1. Proofread and tighten all text in the launch plan below
2. For each daily task that mentions creating a Reddit post, Twitter post, or any social media content, generate a draft following the ENGAGING HUMAN CONTENT FRAMEWORK

ENGAGING HUMAN CONTENT FRAMEWORK:

1. **Relatable Struggle (Hook)**
   - Open with a moment of truth, frustration, or vulnerability — NOT the product
   - Start with the problem, the human emotion, the "why does this matter"
   - Example: "I spent 3 hours every Monday manually copying data between spreadsheets, questioning my life choices..."

2. **Quiet Build-up (Context)**
   - Add context that lets people identify with your situation
   - Don't dump details, share the why and how you got there
   - Include specific details that make it real
   - Example: "As a solo founder juggling 12 clients, I tried everything: complicated automation tools, hiring a VA (too expensive), even waking up at 5am to 'get ahead' of it..."

3. **A Turning Point (Emotional Tension)**
   - Include a shift, some internal or external moment where things got real
   - Self-doubt, stress, risk, urgency — make it human
   - Example: "Last month I almost lost my biggest client because I sent them the wrong data. That's when I realized I couldn't keep doing this..."

4. **Your Breakthrough (The Reveal)**
   - Introduce your solution like a survival tactic or tool you wish someone handed you sooner
   - Make the value personal BEFORE you mention the product
   - Weave in the value proposition naturally, not as a sales pitch
   - Include alternatives and complementary tools to provide genuine value
   - The CTA should be woven into the story, not tacked on at the end
   - Example: "I started using a simple combination of Zapier (for the automation) + my own spreadsheet template + a 15-minute weekly review. But I realized others might want something even simpler, so I built [tool]..."

KEY WRITING RULES:
- Write like you're telling a friend about your experience over coffee
- Use specific numbers, times, emotions — make it tangible
- Mention 2-3 alternatives or complementary tools in each post
- The CTA should feel like helpful advice, not a sales pitch
- Focus on providing value first, product second
- No corporate speak, no "game-changer" or "revolutionary"

Rules for the plan:
- Do not change pricing or target fields — leave them as-is or "TBD"
- Keep the same JSON structure
- For Reddit posts: Create titles that promise value, bodies that tell the full story
- For Twitter posts: Create thread-style content where each tweet builds on the story

Input Business Info:
${JSON.stringify(businessInfo, null, 2)}

Raw Plan to Proofread:
${JSON.stringify(rawPlan, null, 2)}

Return JSON in this format:
{
  "proofreadPlan": { /* cleaned up version of the plan */ },
  "postDrafts": [
    {
      "day": 9,
      "channel": "Reddit",
      "draft": {
        "title": "How I went from [specific struggle] to [specific outcome] in [timeframe]",
        "body": "Full story following the 4-part framework with natural paragraphs, specific details, and value-focused content"
      }
    },
    {
      "day": 27,
      "channel": "Twitter",
      "draft": {
        "thread": [
          "Tweet 1: Hook with specific struggle",
          "Tweet 2-3: Context and journey",
          "Tweet 4: Turning point",
          "Tweet 5-6: Solution with alternatives",
          "Tweet 7-8: Results and how others can benefit"
        ]
      }
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview", // Using GPT-4 Turbo as GPT-4.5 proxy
      messages: [
        {
          role: "system",
          content: "You are an expert editor and social media content strategist. Proofread plans and create engaging social media content."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 4000
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from GPT-4.5");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("GPT-4.5 Stage 2 Error:", error);
    throw new Error(`Failed to proofread and generate posts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Stage 3: Final QA and completion with O3
async function finalizeWithO3(proofreadPlan: any, postDrafts: any[]): Promise<LaunchPlanResponse> {
  const frameworkChecklist = [
    "overview ends with a clear Day-30 outcome",
    "every dailyTask has task, tools[], time, kpi",
    "tools array: names only; pricing → retain or TBD",
    "no hard-coded budgets or KPI targets",
    "all social media posts have drafts embedded that don't include any em dashes whatsoever"
  ];

  const prompt = `
You are the final quality assurance model for launch plans. Your job is to:

1. Verify schema compliance against the framework checklist
2. Merge post drafts into their corresponding daily tasks
3. Ensure every field follows the required format
4. Add notes for any missing or problematic fields

Framework Checklist:
${frameworkChecklist.map((item, i) => `${i + 1}. ${item}`).join('\n')}

Proofread Plan:
${JSON.stringify(proofreadPlan, null, 2)}

Post Drafts to Embed:
${JSON.stringify(postDrafts, null, 2)}

Rules:
- Embed each postDraft into its matching dailyTask under a "postDraft" key
- Convert tool field to tools array if needed (containing just tool names)
- Convert day to string format (e.g., "D1", "D2", etc.)
- Convert description to task field
- If any required field is missing, set it to "TBD" and add notes
- Return the final JSON plan ready for delivery
- Do not include any em dashes in the final output

Expected schema for dailyTasks:
{
  "day": "D1",
  "task": "verb-first task description", 
  "tools": ["Tool name"],
  "time": "2h",
  "kpi": "metric to track",
  "postDraft": { /* if applicable */ }
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Using GPT-4o as O3 proxy (most capable model)
      messages: [
        {
          role: "system",
          content: "You are a meticulous QA specialist ensuring launch plans are complete, accurate, and follow all framework requirements."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // Lower temperature for consistency
      max_tokens: 4000
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from O3");
    }

    const finalPlan = JSON.parse(content);
    
    // Transform to match expected schema
    const transformedPlan = {
      overview: finalPlan.overview,
      weeklyPlan: finalPlan.weeklyPlan.map((week: any) => ({
        title: week.title,
        goal: week.goal,
        dailyTasks: week.dailyTasks.map((task: any) => ({
          day: task.day,
          description: task.task || task.description,
          timeEstimate: task.time || task.timeEstimate,
          tool: Array.isArray(task.tools) ? task.tools.join(", ") : task.tool,
          kpi: task.kpi,
          postDraft: task.postDraft
        })),
        redditTips: week.redditTips || []
      })),
      recommendedTools: finalPlan.recommendedTools || [],
      kpis: finalPlan.kpis || [],
      nextActions: finalPlan.nextActions
    };

    return transformedPlan as LaunchPlanResponse;
  } catch (error) {
    console.error("O3 Stage 3 Error:", error);
    throw new Error(`Failed to finalize plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Main orchestrator function
export async function generateLaunchPlan(businessInfo: BusinessInfo): Promise<LaunchPlanResponse> {
  try {
    console.log("Stage 1: Generating initial plan with GPT-4o...");
    const rawPlan = await generateInitialPlan(businessInfo);
    
    console.log("Stage 2: Proofreading and generating social posts with GPT-4.5...");
    const { proofreadPlan, postDrafts } = await proofreadAndGeneratePosts(rawPlan, businessInfo);
    
    console.log("Stage 3: Finalizing with O3 quality assurance...");
    const finalPlan = await finalizeWithO3(proofreadPlan, postDrafts);
    
    console.log("Launch plan generation complete!");
    return finalPlan;
  } catch (error) {
    console.error("Launch plan generation error:", error);
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

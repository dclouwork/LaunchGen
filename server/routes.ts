import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { businessInfoSchema } from "@shared/schema";
import { generateLaunchPlan, extractTextFromPDF } from "./services/openai";
import multer from "multer";

// Extend Express Request type to include file property
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Generate launch plan from text input
  app.post("/api/generate-plan", async (req, res) => {
    try {
      const validatedData = businessInfoSchema.parse(req.body);
      
      const generatedPlan = await generateLaunchPlan(validatedData);
      
      // Store the plan in memory
      const savedPlan = await storage.createLaunchPlan({
        businessInfo: JSON.stringify(validatedData),
        generatedPlan: generatedPlan,
        createdAt: new Date().toISOString(),
      });

      res.json({
        success: true,
        plan: generatedPlan,
        planId: savedPlan.id
      });
    } catch (error) {
      console.error("Generate plan error:", error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate launch plan"
      });
    }
  });

  // Generate launch plan from PDF upload
  app.post("/api/generate-plan-pdf", upload.single('pdf'), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No PDF file uploaded"
        });
      }

      // Convert PDF to base64
      const base64Data = req.file.buffer.toString('base64');
      
      // Extract text from PDF using OpenAI
      const extractedText = await extractTextFromPDF(base64Data);
      
      // Create a basic business info structure from extracted text
      const businessInfo = {
        businessIdea: extractedText,
        industry: "Not specified",
        targetMarket: "Not specified", 
        timeCommitment: "10 hours/week",
        budget: "$0 (Zero-budget)",
        additionalDetails: "Extracted from uploaded PDF document"
      };

      const generatedPlan = await generateLaunchPlan(businessInfo);
      
      // Store the plan in memory
      const savedPlan = await storage.createLaunchPlan({
        businessInfo: JSON.stringify(businessInfo),
        generatedPlan: generatedPlan,
        createdAt: new Date().toISOString(),
      });

      res.json({
        success: true,
        plan: generatedPlan,
        planId: savedPlan.id,
        extractedText: extractedText
      });
    } catch (error) {
      console.error("Generate plan from PDF error:", error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to process PDF and generate launch plan"
      });
    }
  });

  // Get existing launch plan
  app.get("/api/plan/:id", async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      const plan = await storage.getLaunchPlan(planId);
      
      if (!plan) {
        return res.status(404).json({
          success: false,
          error: "Launch plan not found"
        });
      }

      res.json({
        success: true,
        plan: plan.generatedPlan
      });
    } catch (error) {
      console.error("Get plan error:", error);
      res.status(400).json({
        success: false,
        error: "Failed to retrieve launch plan"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

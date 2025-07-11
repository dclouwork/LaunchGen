import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { body, param, validationResult } from "express-validator";
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
        updatedAt: new Date().toISOString(),
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
      
      // Get form data from request body
      const { industry, targetMarket, timeCommitment, budget, additionalDetails } = req.body;
      
      // Create business info structure combining PDF content and form data
      const businessInfo = {
        businessIdea: extractedText,
        industry: industry || "Not specified",
        targetMarket: targetMarket || "Not specified", 
        timeCommitment: timeCommitment || "10 hours/week",
        budget: budget || "$0 (Zero-budget)",
        additionalDetails: additionalDetails || "Extracted from uploaded PDF document"
      };

      const generatedPlan = await generateLaunchPlan(businessInfo);
      
      // Store the plan in memory
      const savedPlan = await storage.createLaunchPlan({
        businessInfo: JSON.stringify(businessInfo),
        generatedPlan: generatedPlan,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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

  // Update existing launch plan
  app.put("/api/plan/:id", [
    param('id').isInt({ min: 1 }).withMessage('Invalid plan ID'),
    body('generatedPlan').isObject().withMessage('Generated plan must be an object'),
    body('generatedPlan.title').optional().isString().trim().isLength({ max: 200 })
      .withMessage('Title must be less than 200 characters')
  ], async (req: Request, res: Response) => {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    try {
      const planId = parseInt(req.params.id);
      const updates = req.body;
      
      // Update the plan
      const updatedPlan = await storage.updateLaunchPlan(planId, {
        generatedPlan: updates.generatedPlan,
        updatedAt: new Date().toISOString(),
      });
      
      if (!updatedPlan) {
        return res.status(404).json({
          success: false,
          error: "Launch plan not found"
        });
      }
      
      res.json({
        success: true,
        plan: updatedPlan.generatedPlan
      });
    } catch (error) {
      console.error("Update plan error:", error);
      res.status(400).json({
        success: false,
        error: "Failed to update launch plan"
      });
    }
  });

  // Generate share token for a plan
  app.post("/api/plan/:id/share", async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      
      // Generate a unique share token
      const shareToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
      
      const updatedPlan = await storage.updateLaunchPlan(planId, {
        shareToken: shareToken,
        updatedAt: new Date().toISOString(),
      });
      
      if (!updatedPlan) {
        return res.status(404).json({
          success: false,
          error: "Launch plan not found"
        });
      }
      
      res.json({
        success: true,
        shareToken: shareToken,
        shareUrl: `/share/${shareToken}`
      });
    } catch (error) {
      console.error("Generate share token error:", error);
      res.status(400).json({
        success: false,
        error: "Failed to generate share token"
      });
    }
  });

  // Get plan by share token
  app.get("/api/share/:token", async (req, res) => {
    try {
      const shareToken = req.params.token;
      const plan = await storage.getLaunchPlanByShareToken(shareToken);
      
      if (!plan) {
        return res.status(404).json({
          success: false,
          error: "Shared plan not found"
        });
      }
      
      res.json({
        success: true,
        plan: plan.generatedPlan,
        isEditable: plan.isEditable
      });
    } catch (error) {
      console.error("Get shared plan error:", error);
      res.status(400).json({
        success: false,
        error: "Failed to retrieve shared plan"
      });
    }
  });

  // Community Feedback Routes
  
  // Get all feedback
  app.get("/api/feedback", async (req, res) => {
    try {
      const allFeedback = await storage.getAllFeedback();
      
      // Use consistent votingId for tracking votes
      const userIdentifier = req.session?.votingId;
      const feedbackWithVotes = await Promise.all(
        allFeedback.map(async (feedback) => {
          const userVote = userIdentifier 
            ? await storage.getUserVote(feedback.id, userIdentifier)
            : undefined;
          return {
            ...feedback,
            userVote: userVote?.voteType
          };
        })
      );
      
      res.json({
        success: true,
        feedback: feedbackWithVotes
      });
    } catch (error) {
      console.error("Get feedback error:", error);
      res.status(400).json({
        success: false,
        error: "Failed to retrieve feedback"
      });
    }
  });

  // Create new feedback
  app.post("/api/feedback", [
    body('feedback').isString().trim().isLength({ min: 10, max: 1000 })
      .withMessage('Feedback must be between 10 and 1000 characters'),
    body('name').optional().isString().trim().isLength({ max: 100 })
      .withMessage('Name must be less than 100 characters'),
    body('startupName').optional().isString().trim().isLength({ max: 100 })
      .withMessage('Startup name must be less than 100 characters'),
    body('domain').optional().isString().trim().isLength({ max: 100 })
      .withMessage('Domain must be less than 100 characters')
  ], async (req: Request, res: Response) => {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    try {
      const { name, startupName, domain, feedback } = req.body;
      
      // Generate anonymous name if not provided
      const feedbackName = name || generateAnonymousName();
      
      const newFeedback = await storage.createFeedback({
        name: feedbackName,
        startupName: startupName || null,
        domain: domain || null,
        feedback
      });
      
      res.json({
        success: true,
        feedback: newFeedback
      });
    } catch (error) {
      console.error("Create feedback error:", error);
      res.status(400).json({
        success: false,
        error: "Failed to create feedback"
      });
    }
  });

  // Vote on feedback
  app.post("/api/feedback/:id/vote", [
    param('id').isInt({ min: 1 }).withMessage('Invalid feedback ID'),
    body('voteType').isIn(['upvote', 'downvote']).withMessage('Vote type must be upvote or downvote')
  ], async (req: Request, res: Response) => {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    try {
      const feedbackId = parseInt(req.params.id);
      const { voteType } = req.body;
      
      // Ensure session is saved for voting
      if (!req.session.votingId) {
        req.session.votingId = req.sessionID;
        req.session.save(); // Force save the session
      }
      
      const userIdentifier = req.session.votingId;
      
      await storage.voteFeedback(feedbackId, userIdentifier, voteType);
      
      res.json({
        success: true
      });
    } catch (error) {
      console.error("Vote feedback error:", error);
      res.status(400).json({
        success: false,
        error: "Failed to vote on feedback"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to generate anonymous names
function generateAnonymousName(): string {
  const adjectives = [
    'Anonymous', 'Creative', 'Innovative', 'Strategic', 'Curious',
    'Ambitious', 'Visionary', 'Dedicated', 'Inspired', 'Dynamic'
  ];
  const nouns = [
    'Founder', 'Entrepreneur', 'Builder', 'Creator', 'Innovator',
    'Maker', 'Pioneer', 'Visionary', 'Developer', 'Strategist'
  ];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adjective} ${noun}`;
}

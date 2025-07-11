import { 
  users, 
  launchPlans, 
  communityFeedback,
  feedbackVotes,
  type User, 
  type InsertUser, 
  type LaunchPlan, 
  type InsertLaunchPlan,
  type CommunityFeedback,
  type InsertCommunityFeedback,
  type FeedbackVote,
  type InsertFeedbackVote
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createLaunchPlan(plan: InsertLaunchPlan): Promise<LaunchPlan>;
  getLaunchPlan(id: number): Promise<LaunchPlan | undefined>;
  getLaunchPlanByShareToken(shareToken: string): Promise<LaunchPlan | undefined>;
  updateLaunchPlan(id: number, updates: Partial<InsertLaunchPlan>): Promise<LaunchPlan | undefined>;
  getUserLaunchPlans(userId: number): Promise<LaunchPlan[]>;
  
  // Community Feedback methods
  createFeedback(feedback: InsertCommunityFeedback): Promise<CommunityFeedback>;
  getFeedback(id: number): Promise<CommunityFeedback | undefined>;
  getAllFeedback(): Promise<CommunityFeedback[]>;
  voteFeedback(feedbackId: number, userIdentifier: string, voteType: 'upvote' | 'downvote'): Promise<void>;
  getUserVote(feedbackId: number, userIdentifier: string): Promise<FeedbackVote | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private launchPlans: Map<number, LaunchPlan>;
  private communityFeedback: Map<number, CommunityFeedback>;
  private feedbackVotes: Map<number, FeedbackVote>;
  private currentUserId: number;
  private currentPlanId: number;
  private currentFeedbackId: number;
  private currentVoteId: number;

  constructor() {
    this.users = new Map();
    this.launchPlans = new Map();
    this.communityFeedback = new Map();
    this.feedbackVotes = new Map();
    this.currentUserId = 1;
    this.currentPlanId = 1;
    this.currentFeedbackId = 1;
    this.currentVoteId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createLaunchPlan(insertPlan: InsertLaunchPlan): Promise<LaunchPlan> {
    const id = this.currentPlanId++;
    const plan: LaunchPlan = { 
      ...insertPlan, 
      id,
      userId: insertPlan.userId || null,
      shareToken: insertPlan.shareToken || null,
      isEditable: insertPlan.isEditable ?? true
    };
    this.launchPlans.set(id, plan);
    return plan;
  }

  async getLaunchPlan(id: number): Promise<LaunchPlan | undefined> {
    return this.launchPlans.get(id);
  }

  async getLaunchPlanByShareToken(shareToken: string): Promise<LaunchPlan | undefined> {
    return Array.from(this.launchPlans.values()).find(
      (plan) => plan.shareToken === shareToken
    );
  }

  async updateLaunchPlan(id: number, updates: Partial<InsertLaunchPlan>): Promise<LaunchPlan | undefined> {
    const plan = this.launchPlans.get(id);
    if (!plan) return undefined;
    
    const updatedPlan: LaunchPlan = {
      ...plan,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.launchPlans.set(id, updatedPlan);
    return updatedPlan;
  }

  async getUserLaunchPlans(userId: number): Promise<LaunchPlan[]> {
    return Array.from(this.launchPlans.values()).filter(
      (plan) => plan.userId === userId
    );
  }

  async createFeedback(insertFeedback: InsertCommunityFeedback): Promise<CommunityFeedback> {
    const id = this.currentFeedbackId++;
    const feedback: CommunityFeedback = {
      ...insertFeedback,
      id,
      upvotes: 0,
      downvotes: 0,
      createdAt: new Date()
    };
    this.communityFeedback.set(id, feedback);
    return feedback;
  }

  async getFeedback(id: number): Promise<CommunityFeedback | undefined> {
    return this.communityFeedback.get(id);
  }

  async getAllFeedback(): Promise<CommunityFeedback[]> {
    return Array.from(this.communityFeedback.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async voteFeedback(feedbackId: number, userIdentifier: string, voteType: 'upvote' | 'downvote'): Promise<void> {
    const feedback = this.communityFeedback.get(feedbackId);
    if (!feedback) return;

    // Check if user has already voted
    const existingVote = Array.from(this.feedbackVotes.values()).find(
      vote => vote.feedbackId === feedbackId && vote.userIdentifier === userIdentifier
    );

    if (existingVote) {
      // Update existing vote
      if (existingVote.voteType !== voteType) {
        // Change vote type
        if (existingVote.voteType === 'upvote') {
          feedback.upvotes--;
          feedback.downvotes++;
        } else {
          feedback.downvotes--;
          feedback.upvotes++;
        }
        existingVote.voteType = voteType;
      }
    } else {
      // Create new vote
      const id = this.currentVoteId++;
      const vote: FeedbackVote = {
        id,
        feedbackId,
        userIdentifier,
        voteType,
        createdAt: new Date()
      };
      this.feedbackVotes.set(id, vote);

      // Update feedback counts
      if (voteType === 'upvote') {
        feedback.upvotes++;
      } else {
        feedback.downvotes++;
      }
    }
  }

  async getUserVote(feedbackId: number, userIdentifier: string): Promise<FeedbackVote | undefined> {
    return Array.from(this.feedbackVotes.values()).find(
      vote => vote.feedbackId === feedbackId && vote.userIdentifier === userIdentifier
    );
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createLaunchPlan(insertPlan: InsertLaunchPlan): Promise<LaunchPlan> {
    const [plan] = await db
      .insert(launchPlans)
      .values(insertPlan)
      .returning();
    return plan;
  }

  async getLaunchPlan(id: number): Promise<LaunchPlan | undefined> {
    const [plan] = await db.select().from(launchPlans).where(eq(launchPlans.id, id));
    return plan || undefined;
  }

  async getLaunchPlanByShareToken(shareToken: string): Promise<LaunchPlan | undefined> {
    const [plan] = await db.select().from(launchPlans).where(eq(launchPlans.shareToken, shareToken));
    return plan || undefined;
  }

  async updateLaunchPlan(id: number, updates: Partial<InsertLaunchPlan>): Promise<LaunchPlan | undefined> {
    const [updatedPlan] = await db
      .update(launchPlans)
      .set({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .where(eq(launchPlans.id, id))
      .returning();
    return updatedPlan || undefined;
  }

  async getUserLaunchPlans(userId: number): Promise<LaunchPlan[]> {
    return await db.select().from(launchPlans).where(eq(launchPlans.userId, userId));
  }

  async createFeedback(insertFeedback: InsertCommunityFeedback): Promise<CommunityFeedback> {
    const [feedback] = await db
      .insert(communityFeedback)
      .values(insertFeedback)
      .returning();
    return feedback;
  }

  async getFeedback(id: number): Promise<CommunityFeedback | undefined> {
    const [feedback] = await db.select().from(communityFeedback).where(eq(communityFeedback.id, id));
    return feedback || undefined;
  }

  async getAllFeedback(): Promise<CommunityFeedback[]> {
    return await db.select().from(communityFeedback).orderBy(desc(communityFeedback.createdAt));
  }

  async voteFeedback(feedbackId: number, userIdentifier: string, voteType: 'upvote' | 'downvote'): Promise<void> {
    // Check if user has already voted
    const [existingVote] = await db
      .select()
      .from(feedbackVotes)
      .where(
        and(
          eq(feedbackVotes.feedbackId, feedbackId),
          eq(feedbackVotes.userIdentifier, userIdentifier)
        )
      );

    if (existingVote) {
      // Update existing vote if different
      if (existingVote.voteType !== voteType) {
        await db
          .update(feedbackVotes)
          .set({ voteType })
          .where(eq(feedbackVotes.id, existingVote.id));

        // Update feedback counts
        if (voteType === 'upvote') {
          await db
            .update(communityFeedback)
            .set({
              upvotes: db.sql`${communityFeedback.upvotes} + 1`,
              downvotes: db.sql`${communityFeedback.downvotes} - 1`
            })
            .where(eq(communityFeedback.id, feedbackId));
        } else {
          await db
            .update(communityFeedback)
            .set({
              upvotes: db.sql`${communityFeedback.upvotes} - 1`,
              downvotes: db.sql`${communityFeedback.downvotes} + 1`
            })
            .where(eq(communityFeedback.id, feedbackId));
        }
      }
    } else {
      // Create new vote
      await db
        .insert(feedbackVotes)
        .values({
          feedbackId,
          userIdentifier,
          voteType
        });

      // Update feedback count
      if (voteType === 'upvote') {
        await db
          .update(communityFeedback)
          .set({ upvotes: db.sql`${communityFeedback.upvotes} + 1` })
          .where(eq(communityFeedback.id, feedbackId));
      } else {
        await db
          .update(communityFeedback)
          .set({ downvotes: db.sql`${communityFeedback.downvotes} + 1` })
          .where(eq(communityFeedback.id, feedbackId));
      }
    }
  }

  async getUserVote(feedbackId: number, userIdentifier: string): Promise<FeedbackVote | undefined> {
    const [vote] = await db
      .select()
      .from(feedbackVotes)
      .where(
        and(
          eq(feedbackVotes.feedbackId, feedbackId),
          eq(feedbackVotes.userIdentifier, userIdentifier)
        )
      );
    return vote || undefined;
  }
}

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();

import { users, launchPlans, type User, type InsertUser, type LaunchPlan, type InsertLaunchPlan } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createLaunchPlan(plan: InsertLaunchPlan): Promise<LaunchPlan>;
  getLaunchPlan(id: number): Promise<LaunchPlan | undefined>;
  getLaunchPlanByShareToken(shareToken: string): Promise<LaunchPlan | undefined>;
  updateLaunchPlan(id: number, updates: Partial<InsertLaunchPlan>): Promise<LaunchPlan | undefined>;
  getUserLaunchPlans(userId: number): Promise<LaunchPlan[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private launchPlans: Map<number, LaunchPlan>;
  private currentUserId: number;
  private currentPlanId: number;

  constructor() {
    this.users = new Map();
    this.launchPlans = new Map();
    this.currentUserId = 1;
    this.currentPlanId = 1;
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
}

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();

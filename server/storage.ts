import { users, launchPlans, type User, type InsertUser, type LaunchPlan, type InsertLaunchPlan } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createLaunchPlan(plan: InsertLaunchPlan): Promise<LaunchPlan>;
  getLaunchPlan(id: number): Promise<LaunchPlan | undefined>;
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
    const plan: LaunchPlan = { ...insertPlan, id };
    this.launchPlans.set(id, plan);
    return plan;
  }

  async getLaunchPlan(id: number): Promise<LaunchPlan | undefined> {
    return this.launchPlans.get(id);
  }
}

export const storage = new MemStorage();

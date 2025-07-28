import { users, cvs, jobPreferences, applications, type User, type InsertUser, type Cv, type InsertCv, type JobPreferences, type InsertJobPreferences, type Application, type InsertApplication } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // CV methods
  createCv(cv: InsertCv): Promise<Cv>;
  getUserCvs(userId: string): Promise<Cv[]>;
  getCv(id: string): Promise<Cv | undefined>;
  deleteCv(id: string): Promise<void>;
  
  // Job preferences methods
  createJobPreferences(preferences: InsertJobPreferences): Promise<JobPreferences>;
  getUserJobPreferences(userId: string): Promise<JobPreferences | undefined>;
  updateJobPreferences(userId: string, preferences: Partial<InsertJobPreferences>): Promise<JobPreferences>;
  
  // Application methods
  createApplication(application: InsertApplication): Promise<Application>;
  getUserApplications(userId: string, limit?: number): Promise<Application[]>;
  getApplication(id: string): Promise<Application | undefined>;
  updateApplicationStatus(id: string, status: string, responseData?: any): Promise<Application>;
  getUserApplicationStats(userId: string): Promise<{
    total: number;
    sent: number;
    pending: number;
    responded: number;
    failed: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // CV methods
  async createCv(insertCv: InsertCv): Promise<Cv> {
    const [cv] = await db
      .insert(cvs)
      .values(insertCv)
      .returning();
    return cv;
  }

  async getUserCvs(userId: string): Promise<Cv[]> {
    return await db.select().from(cvs).where(eq(cvs.userId, userId)).orderBy(desc(cvs.uploadedAt));
  }

  async getCv(id: string): Promise<Cv | undefined> {
    const [cv] = await db.select().from(cvs).where(eq(cvs.id, id));
    return cv || undefined;
  }

  async deleteCv(id: string): Promise<void> {
    await db.delete(cvs).where(eq(cvs.id, id));
  }

  // Job preferences methods
  async createJobPreferences(insertPreferences: InsertJobPreferences): Promise<JobPreferences> {
    const [preferences] = await db
      .insert(jobPreferences)
      .values([insertPreferences])
      .returning();
    return preferences;
  }

  async getUserJobPreferences(userId: string): Promise<JobPreferences | undefined> {
    const [preferences] = await db.select().from(jobPreferences).where(eq(jobPreferences.userId, userId));
    return preferences || undefined;
  }

  async updateJobPreferences(userId: string, updateData: Partial<InsertJobPreferences>): Promise<JobPreferences> {
    const [preferences] = await db
      .update(jobPreferences)
      .set({ 
        ...updateData, 
        updatedAt: new Date() 
      } as any)
      .where(eq(jobPreferences.userId, userId))
      .returning();
    return preferences;
  }

  // Application methods
  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const [application] = await db
      .insert(applications)
      .values(insertApplication)
      .returning();
    return application;
  }

  async getUserApplications(userId: string, limit = 50): Promise<Application[]> {
    return await db
      .select()
      .from(applications)
      .where(eq(applications.userId, userId))
      .orderBy(desc(applications.appliedAt))
      .limit(limit);
  }

  async getApplication(id: string): Promise<Application | undefined> {
    const [application] = await db.select().from(applications).where(eq(applications.id, id));
    return application || undefined;
  }

  async updateApplicationStatus(id: string, status: string, responseData?: any): Promise<Application> {
    const updateData: any = { status };
    if (responseData) {
      updateData.responseData = responseData;
      updateData.responseAt = new Date();
    }
    
    const [application] = await db
      .update(applications)
      .set(updateData)
      .where(eq(applications.id, id))
      .returning();
    return application;
  }

  async getUserApplicationStats(userId: string): Promise<{
    total: number;
    sent: number;
    pending: number;
    responded: number;
    failed: number;
  }> {
    const userApplications = await db
      .select()
      .from(applications)
      .where(eq(applications.userId, userId));

    const stats = {
      total: userApplications.length,
      sent: userApplications.filter(app => app.status === 'sent').length,
      pending: userApplications.filter(app => app.status === 'pending').length,
      responded: userApplications.filter(app => app.status === 'responded').length,
      failed: userApplications.filter(app => app.status === 'failed').length,
    };

    return stats;
  }
}

export const storage = new DatabaseStorage();

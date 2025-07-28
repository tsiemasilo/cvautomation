import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertJobPreferencesSchema, insertApplicationSchema } from "@shared/schema";
import { jobSearchService } from "./services/jobSearch";
import { emailService } from "./services/emailService";
import { cvParserService } from "./services/cvParser";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // User registration
  app.post("/api/users/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = await storage.createUser(userData);
      res.json({ user: { id: user.id, email: user.email, username: user.username, name: user.name, plan: user.plan } });
    } catch (error) {
      res.status(400).json({ message: "Invalid user data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // User login
  app.post("/api/users/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({ user: { id: user.id, email: user.email, username: user.username, name: user.name, plan: user.plan } });
    } catch (error) {
      res.status(500).json({ message: "Login failed", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // CV upload and parsing
  app.post("/api/cvs/upload", upload.single('cv'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Parse CV content
      const parsedData = await cvParserService.parseCV(req.file.path, req.file.mimetype);

      const cv = await storage.createCv({
        userId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        parsedData,
      });

      res.json({ cv, parsedData });
    } catch (error) {
      res.status(500).json({ message: "CV upload failed", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Get user CVs
  app.get("/api/users/:userId/cvs", async (req, res) => {
    try {
      const { userId } = req.params;
      const cvs = await storage.getUserCvs(userId);
      res.json({ cvs });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch CVs", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Job preferences
  app.post("/api/users/:userId/job-preferences", async (req, res) => {
    try {
      const { userId } = req.params;
      const preferencesData = insertJobPreferencesSchema.parse({ ...req.body, userId });
      
      // Check if preferences already exist
      const existingPreferences = await storage.getUserJobPreferences(userId);
      
      let preferences;
      if (existingPreferences) {
        preferences = await storage.updateJobPreferences(userId, preferencesData);
      } else {
        preferences = await storage.createJobPreferences(preferencesData);
      }

      res.json({ preferences });
    } catch (error) {
      res.status(400).json({ message: "Invalid preferences data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Get user job preferences
  app.get("/api/users/:userId/job-preferences", async (req, res) => {
    try {
      const { userId } = req.params;
      const preferences = await storage.getUserJobPreferences(userId);
      res.json({ preferences });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job preferences", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Search jobs
  app.post("/api/jobs/search", async (req, res) => {
    try {
      const { keywords, location, limit = 20 } = req.body;
      
      if (!keywords) {
        return res.status(400).json({ message: "Keywords are required" });
      }

      const jobs = await jobSearchService.searchJobs(keywords, location, limit);
      res.json({ jobs });
    } catch (error) {
      res.status(500).json({ message: "Job search failed", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Apply to job
  app.post("/api/jobs/apply", async (req, res) => {
    try {
      const applicationData = insertApplicationSchema.parse(req.body);
      
      // Get user CV for application
      const userCvs = await storage.getUserCvs(applicationData.userId);
      if (userCvs.length === 0) {
        return res.status(400).json({ message: "No CV found. Please upload a CV first." });
      }

      const latestCv = userCvs[0]; // Use the most recent CV

      // Apply via email
      if (applicationData.applicationMethod === 'email') {
        const emailResult = await emailService.sendJobApplication({
          to: (applicationData.applicationData as any)?.email || '',
          jobTitle: applicationData.jobTitle,
          company: applicationData.company,
          cvPath: path.join(uploadDir, latestCv.filename),
          cvOriginalName: latestCv.originalName,
          applicantName: (latestCv.parsedData as any)?.name || 'Job Applicant',
          customMessage: (applicationData.applicationData as any)?.customMessage,
        });

        if (!emailResult.success) {
          throw new Error(emailResult.error);
        }
      }

      const application = await storage.createApplication(applicationData);
      res.json({ application });
    } catch (error) {
      res.status(500).json({ message: "Job application failed", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Get user applications
  app.get("/api/users/:userId/applications", async (req, res) => {
    try {
      const { userId } = req.params;
      const { limit } = req.query;
      
      const applications = await storage.getUserApplications(userId, limit ? parseInt(limit as string) : undefined);
      res.json({ applications });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch applications", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Get user application statistics
  app.get("/api/users/:userId/stats", async (req, res) => {
    try {
      const { userId } = req.params;
      const stats = await storage.getUserApplicationStats(userId);
      res.json({ stats });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Auto-apply to jobs
  app.post("/api/jobs/auto-apply", async (req, res) => {
    try {
      const { userId, maxApplications = 5 } = req.body;

      // Get user preferences
      const preferences = await storage.getUserJobPreferences(userId);
      if (!preferences) {
        return res.status(400).json({ message: "Please set job preferences first" });
      }

      // Get user CV
      const userCvs = await storage.getUserCvs(userId);
      if (userCvs.length === 0) {
        return res.status(400).json({ message: "No CV found. Please upload a CV first." });
      }

      // Search for jobs based on preferences
      const jobs = await jobSearchService.searchJobs(
        preferences.keywords || '',
        preferences.locations?.[0] || '',
        maxApplications * 2 // Get more jobs to filter from
      );

      const applications = [];
      let applicationCount = 0;

      for (const job of jobs) {
        if (applicationCount >= maxApplications) break;

        try {
          // Check if we already applied to this job
          const existingApplications = await storage.getUserApplications(userId);
          const alreadyApplied = existingApplications.some(app => 
            app.company === job.company && app.jobTitle === job.title
          );

          if (alreadyApplied) continue;

          // Apply via email if contact email is available
          if (job.contactEmail) {
            const application = await storage.createApplication({
              userId,
              jobTitle: job.title,
              company: job.company,
              jobDescription: job.description,
              jobUrl: job.url,
              applicationMethod: 'email',
              appliedVia: job.source,
              applicationData: {
                email: job.contactEmail,
                autoApplied: true,
              },
            });

            // Send email application
            const latestCv = userCvs[0];
            const emailResult = await emailService.sendJobApplication({
              to: job.contactEmail,
              jobTitle: job.title,
              company: job.company,
              cvPath: path.join(uploadDir, latestCv.filename),
              cvOriginalName: latestCv.originalName,
              applicantName: (latestCv.parsedData as any)?.name || 'Job Applicant',
            });

            if (emailResult.success) {
              applications.push(application);
              applicationCount++;
            } else {
              // Update application status to failed
              await storage.updateApplicationStatus(application.id, 'failed', { error: emailResult.error });
            }
          }
        } catch (error) {
          console.error('Error applying to job:', error);
        }
      }

      res.json({ 
        message: `Successfully applied to ${applications.length} jobs`,
        applications: applications.length,
        jobsFound: jobs.length,
      });
    } catch (error) {
      res.status(500).json({ message: "Auto-apply failed", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertTransactionSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Signup route
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const signupSchema = z.object({
        firstName: z.string().min(2, "First name must be at least 2 characters"),
        lastName: z.string().min(2, "Last name must be at least 2 characters"),
        email: z.string().email().optional(),
        phone: z.string().min(10).optional(),
        password: z.string().min(6, "Password must be at least 6 characters"),
        signupMethod: z.enum(["email", "phone"]),
      });

      const validation = signupSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid signup data",
          errors: validation.error.errors 
        });
      }

      const { firstName, lastName, email, phone, password, signupMethod } = validation.data;

      // Check if user already exists
      const existingUser = signupMethod === "email" 
        ? await storage.getUserByEmail(email!)
        : await storage.getUserByPhone(phone!);

      if (existingUser) {
        return res.status(409).json({ 
          message: `User with this ${signupMethod} already exists` 
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const newUser = await storage.createUser({
        firstName,
        lastName,
        email: signupMethod === "email" ? email : null,
        phone: signupMethod === "phone" ? phone : null,
        password: hashedPassword,
      });

      // Remove password from response
      const { password: _, ...userResponse } = newUser;
      
      res.status(201).json({
        message: "Account created successfully",
        user: userResponse
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Login route for email/phone authentication
  app.post('/api/auth/signin', async (req, res) => {
    try {
      const signinSchema = z.object({
        email: z.string().optional(),
        phone: z.string().optional(),
        password: z.string().min(6),
        signinMethod: z.enum(["email", "phone"]),
      });

      const validation = signinSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid signin data",
          errors: validation.error.errors 
        });
      }

      const { email, phone, password, signinMethod } = validation.data;

      // Find user
      const user = signinMethod === "email" 
        ? await storage.getUserByEmail(email!)
        : await storage.getUserByPhone(phone!);

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Remove password from response
      const { password: _, ...userResponse } = user;
      
      res.json({
        message: "Signed in successfully",
        user: userResponse
      });
    } catch (error) {
      console.error("Signin error:", error);
      res.status(500).json({ message: "Failed to sign in" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get all transactions for authenticated user
  app.get("/api/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions = await storage.getTransactions(userId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Get balance summary for authenticated user
  app.get("/api/balance", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const balance = await storage.getBalance(userId);
      res.json(balance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch balance" });
    }
  });

  // Create a new transaction for authenticated user
  app.post("/api/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validation = insertTransactionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid transaction data",
          errors: validation.error.errors 
        });
      }

      const transaction = await storage.createTransaction(validation.data, userId);
      res.status(201).json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  // Delete a transaction for authenticated user
  app.delete("/api/transactions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid transaction ID" });
      }

      const deleted = await storage.deleteTransaction(id);
      if (!deleted) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      res.json({ message: "Transaction deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });

  // Get category spending analysis for authenticated user
  app.get("/api/category-spending", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const categorySpending = await storage.getCategorySpending(userId);
      res.json(categorySpending);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category spending" });
    }
  });

  // Get transactions by date range for authenticated user
  app.get("/api/transactions/range", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }

      const transactions = await storage.getTransactionsByDateRange(start, end, userId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions by date range" });
    }
  });

  // Admin routes - Group management
  app.post("/api/admin/groups", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const groupSchema = z.object({
        name: z.string().min(2),
        description: z.string().optional(),
      });

      const validation = groupSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid group data",
          errors: validation.error.errors 
        });
      }

      const group = await storage.createGroup(validation.data, userId);
      res.status(201).json(group);
    } catch (error) {
      console.error("Create group error:", error);
      res.status(500).json({ message: "Failed to create group" });
    }
  });

  app.get("/api/admin/groups", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const groups = await storage.getGroupsByAdmin(userId);
      res.json(groups);
    } catch (error) {
      console.error("Get groups error:", error);
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });

  app.post("/api/admin/groups/:groupId/members", isAuthenticated, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const groupId = parseInt(req.params.groupId);
      const { email, canAddExpense } = req.body;

      const user = await storage.getUser(adminId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Find user by email
      const targetUser = await storage.getUserByEmail(email);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const userGroup = await storage.addUserToGroup(targetUser.id, groupId, canAddExpense);
      res.status(201).json(userGroup);
    } catch (error) {
      console.error("Add user to group error:", error);
      res.status(500).json({ message: "Failed to add user to group" });
    }
  });

  app.delete("/api/admin/groups/:groupId/members/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const groupId = parseInt(req.params.groupId);
      const userId = req.params.userId;

      const user = await storage.getUser(adminId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const removed = await storage.removeUserFromGroup(userId, groupId);
      if (!removed) {
        return res.status(404).json({ message: "User not found in group" });
      }

      res.json({ message: "User removed from group successfully" });
    } catch (error) {
      console.error("Remove user from group error:", error);
      res.status(500).json({ message: "Failed to remove user from group" });
    }
  });

  app.get("/api/admin/groups/:groupId/members", isAuthenticated, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const groupId = parseInt(req.params.groupId);

      const user = await storage.getUser(adminId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const members = await storage.getGroupMembers(groupId);
      res.json(members);
    } catch (error) {
      console.error("Get group members error:", error);
      res.status(500).json({ message: "Failed to fetch group members" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

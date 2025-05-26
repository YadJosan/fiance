import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertTransactionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

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

  const httpServer = createServer(app);
  return httpServer;
}

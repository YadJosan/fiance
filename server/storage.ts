import {
  transactions,
  users,
  type Transaction,
  type InsertTransaction,
  type User,
  type UpsertUser,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Transaction operations
  getTransactions(userId: string): Promise<Transaction[]>;
  getTransactionById(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction, userId: string): Promise<Transaction>;
  deleteTransaction(id: number): Promise<boolean>;
  getBalance(userId: string): Promise<{ balance: number; income: number; expenses: number }>;
  getTransactionsByDateRange(startDate: Date, endDate: Date, userId: string): Promise<Transaction[]>;
  getTransactionsByCategory(category: string, userId: string): Promise<Transaction[]>;
  getCategorySpending(userId: string): Promise<Array<{ category: string; amount: number; percentage: number }>>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Transaction operations
  async getTransactions(userId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy((transactions) => transactions.date);
  }

  async getTransactionById(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id));
    return transaction;
  }

  async createTransaction(insertTransaction: InsertTransaction, userId: string): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values({
        ...insertTransaction,
        userId,
      })
      .returning();
    return transaction;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    const result = await db
      .delete(transactions)
      .where(eq(transactions.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getBalance(userId: string): Promise<{ balance: number; income: number; expenses: number }> {
    const userTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId));
    
    const income = userTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
    const expenses = userTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
    const balance = income - expenses;
    
    return { balance, income, expenses };
  }

  async getTransactionsByDateRange(startDate: Date, endDate: Date, userId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId));
  }

  async getTransactionsByCategory(category: string, userId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId));
  }

  async getCategorySpending(userId: string): Promise<Array<{ category: string; amount: number; percentage: number }>> {
    const userTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId));
      
    const expenses = userTransactions.filter(t => t.type === "expense");
    const totalExpenses = expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const categoryTotals = new Map<string, number>();
    
    expenses.forEach(transaction => {
      const current = categoryTotals.get(transaction.category) || 0;
      categoryTotals.set(transaction.category, current + parseFloat(transaction.amount));
    });
    
    return Array.from(categoryTotals.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  }
}

export const storage = new DatabaseStorage();

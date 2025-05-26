import {
  transactions,
  users,
  groups,
  userGroups,
  type Transaction,
  type InsertTransaction,
  type User,
  type UpsertUser,
  type Group,
  type InsertGroup,
  type UserGroup,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Additional user operations for email/phone auth
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(userData: {
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    password: string;
  }): Promise<User>;
  
  // Group operations
  createGroup(groupData: InsertGroup, adminId: string): Promise<Group>;
  getGroupsByAdmin(adminId: string): Promise<Group[]>;
  getGroupsByUser(userId: string): Promise<Group[]>;
  addUserToGroup(userId: string, groupId: number, canAddExpense: boolean): Promise<UserGroup>;
  removeUserFromGroup(userId: string, groupId: number): Promise<boolean>;
  updateUserGroupPermission(userId: string, groupId: number, canAddExpense: boolean): Promise<boolean>;
  getUserGroupPermission(userId: string, groupId: number): Promise<UserGroup | undefined>;
  getGroupMembers(groupId: number): Promise<Array<{ id: string; firstName: string; lastName: string; email: string; canAddExpense: boolean }>>;
  
  // Transaction operations
  getTransactions(userId: string): Promise<Transaction[]>;
  getGroupTransactions(groupId: number): Promise<Transaction[]>;
  getTransactionById(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction, userId: string, groupId?: number): Promise<Transaction>;
  deleteTransaction(id: number): Promise<boolean>;
  getBalance(userId: string): Promise<{ balance: number; income: number; expenses: number }>;
  getGroupBalance(groupId: number): Promise<{ balance: number; income: number; expenses: number }>;
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

  // Additional user operations for email/phone auth
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  }

  async createUser(userData: {
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    password: string;
  }): Promise<User> {
    // Generate a unique ID for the user
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const [user] = await db
      .insert(users)
      .values({
        id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
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

  // Group operations
  async createGroup(groupData: InsertGroup, adminId: string): Promise<Group> {
    const [group] = await db
      .insert(groups)
      .values({
        ...groupData,
        adminId,
      })
      .returning();
    return group;
  }

  async getGroupsByAdmin(adminId: string): Promise<Group[]> {
    return await db.select().from(groups).where(eq(groups.adminId, adminId));
  }

  async getGroupsByUser(userId: string): Promise<Group[]> {
    return await db
      .select({
        id: groups.id,
        name: groups.name,
        description: groups.description,
        adminId: groups.adminId,
        createdAt: groups.createdAt,
        updatedAt: groups.updatedAt,
      })
      .from(groups)
      .innerJoin(userGroups, eq(groups.id, userGroups.groupId))
      .where(eq(userGroups.userId, userId));
  }

  async addUserToGroup(userId: string, groupId: number, canAddExpense: boolean): Promise<UserGroup> {
    const [userGroup] = await db
      .insert(userGroups)
      .values({
        userId,
        groupId,
        canAddExpense: canAddExpense ? "true" : "false",
      })
      .returning();
    return userGroup;
  }

  async removeUserFromGroup(userId: string, groupId: number): Promise<boolean> {
    const result = await db
      .delete(userGroups)
      .where(and(eq(userGroups.userId, userId), eq(userGroups.groupId, groupId)));
    return (result.rowCount || 0) > 0;
  }

  async updateUserGroupPermission(userId: string, groupId: number, canAddExpense: boolean): Promise<boolean> {
    const result = await db
      .update(userGroups)
      .set({ canAddExpense: canAddExpense ? "true" : "false" })
      .where(and(eq(userGroups.userId, userId), eq(userGroups.groupId, groupId)));
    return (result.rowCount || 0) > 0;
  }

  async getUserGroupPermission(userId: string, groupId: number): Promise<UserGroup | undefined> {
    const [userGroup] = await db
      .select()
      .from(userGroups)
      .where(and(eq(userGroups.userId, userId), eq(userGroups.groupId, groupId)));
    return userGroup;
  }

  async createTransaction(insertTransaction: InsertTransaction, userId: string, groupId?: number): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values({
        ...insertTransaction,
        userId,
        groupId: groupId ?? null,
      })
      .returning();
    return transaction;
  }

  async getGroupTransactions(groupId: number): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.groupId, groupId))
      .orderBy((transactions) => transactions.date);
  }

  async getGroupBalance(groupId: number): Promise<{ balance: number; income: number; expenses: number }> {
    const groupTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.groupId, groupId));
    
    const income = groupTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
    const expenses = groupTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
    const balance = income - expenses;
    
    return { balance, income, expenses };
  }

  async getGroupMembers(groupId: number): Promise<Array<{ id: string; firstName: string; lastName: string; email: string; canAddExpense: boolean }>> {
    const members = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        canAddExpense: userGroups.canAddExpense,
      })
      .from(users)
      .innerJoin(userGroups, eq(users.id, userGroups.userId))
      .where(eq(userGroups.groupId, groupId));

    return members.map(member => ({
      ...member,
      canAddExpense: member.canAddExpense === "true"
    }));
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

import { transactions, type Transaction, type InsertTransaction, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@shared/schema";

export interface IStorage {
  getTransactions(): Promise<Transaction[]>;
  getTransactionById(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  deleteTransaction(id: number): Promise<boolean>;
  getBalance(): Promise<{ balance: number; income: number; expenses: number }>;
  getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]>;
  getTransactionsByCategory(category: string): Promise<Transaction[]>;
  getCategorySpending(): Promise<Array<{ category: string; amount: number; percentage: number }>>;
}

export class MemStorage implements IStorage {
  private transactions: Map<number, Transaction>;
  private currentId: number;

  constructor() {
    this.transactions = new Map();
    this.currentId = 1;
    
    // Initialize with some sample data for demonstration
    this.seedData();
  }

  private async seedData() {
    const sampleTransactions: Omit<Transaction, 'id'>[] = [
      {
        type: "income",
        amount: "3200.00",
        category: "Salary",
        description: "Monthly salary",
        date: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
      },
      {
        type: "expense",
        amount: "4.50",
        category: "Food & Dining",
        description: "Coffee Shop",
        date: new Date()
      },
      {
        type: "expense",
        amount: "42.80",
        category: "Transportation",
        description: "Gas Station", 
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        type: "expense",
        amount: "127.45",
        category: "Shopping",
        description: "Grocery Store",
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      }
    ];

    for (const transaction of sampleTransactions) {
      const id = this.currentId++;
      const fullTransaction: Transaction = { ...transaction, id };
      this.transactions.set(id, fullTransaction);
    }
  }

  async getTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getTransactionById(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentId++;
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      date: new Date(),
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    return this.transactions.delete(id);
  }

  async getBalance(): Promise<{ balance: number; income: number; expenses: number }> {
    const transactions = Array.from(this.transactions.values());
    
    const income = transactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
    const expenses = transactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
    const balance = income - expenses;
    
    return { balance, income, expenses };
  }

  async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      t => new Date(t.date) >= startDate && new Date(t.date) <= endDate
    );
  }

  async getTransactionsByCategory(category: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      t => t.category === category
    );
  }

  async getCategorySpending(): Promise<Array<{ category: string; amount: number; percentage: number }>> {
    const expenses = Array.from(this.transactions.values()).filter(t => t.type === "expense");
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

export const storage = new MemStorage();

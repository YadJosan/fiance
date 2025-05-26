import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, PlusCircle, MinusCircle, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import AddFundsModal from "@/components/AddFundsModal";
import AddExpenseModal from "@/components/AddExpenseModal";
import { formatCurrency, formatDate, getCategoryIcon, getCategoryColor } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import type { Transaction } from "@shared/schema";

interface BalanceData {
  balance: number;
  income: number;
  expenses: number;
}

interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
}

export default function Dashboard() {
  const [showFundsModal, setShowFundsModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const { user } = useAuth();

  const { data: balance, isLoading: balanceLoading } = useQuery<BalanceData>({
    queryKey: ["/api/balance"],
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: categorySpending, isLoading: categoryLoading } = useQuery<CategorySpending[]>({
    queryKey: ["/api/category-spending"],
  });

  const recentTransactions = transactions?.slice(0, 5) || [];

  return (
    <div className="max-w-sm mx-auto bg-gray-50 min-h-screen relative pb-20">
      {/* Header */}
      <header className="gradient-header text-white p-6 pt-12">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-lg font-semibold">Good morning,</h1>
            <p className="text-blue-100">{(user as any)?.firstName || (user as any)?.email || 'User'}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = '/api/logout'}
            className="w-10 h-10 bg-white bg-opacity-20 rounded-full p-0 hover:bg-white hover:bg-opacity-30"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        <div className="balance-card rounded-2xl p-4">
          <p className="text-blue-100 text-sm font-medium">Current Balance</p>
          {balanceLoading ? (
            <Skeleton className="h-10 w-48 mt-1 bg-white bg-opacity-30" />
          ) : (
            <h2 className="text-3xl font-bold mt-1">
              {formatCurrency(balance?.balance || 0)}
            </h2>
          )}
          <div className="flex justify-between mt-4 pt-4 border-t border-white border-opacity-20">
            <div>
              <p className="text-blue-100 text-xs">Income</p>
              {balanceLoading ? (
                <Skeleton className="h-5 w-16 mt-1 bg-white bg-opacity-30" />
              ) : (
                <p className="text-sm font-semibold text-green-300">
                  +{formatCurrency(balance?.income || 0)}
                </p>
              )}
            </div>
            <div>
              <p className="text-blue-100 text-xs">Expenses</p>
              {balanceLoading ? (
                <Skeleton className="h-5 w-16 mt-1 bg-white bg-opacity-30" />
              ) : (
                <p className="text-sm font-semibold text-red-300">
                  -{formatCurrency(balance?.expenses || 0)}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Quick Actions */}
      <section className="p-6 -mt-8 relative z-10">
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => setShowFundsModal(true)}
            className="bg-green-500 hover:bg-green-600 text-white p-4 h-auto rounded-xl shadow-lg active:scale-95 transition-transform touch-button"
          >
            <div className="flex flex-col items-center space-y-2">
              <PlusCircle className="h-6 w-6" />
              <span className="font-semibold">Add Funds</span>
            </div>
          </Button>
          <Button
            onClick={() => setShowExpenseModal(true)}
            className="bg-red-500 hover:bg-red-600 text-white p-4 h-auto rounded-xl shadow-lg active:scale-95 transition-transform touch-button"
          >
            <div className="flex flex-col items-center space-y-2">
              <MinusCircle className="h-6 w-6" />
              <span className="font-semibold">Add Expense</span>
            </div>
          </Button>
        </div>
      </section>

      {/* Recent Transactions */}
      <section className="px-6 pb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Recent Transactions</h3>
          <Button variant="ghost" className="text-primary text-sm font-medium p-0 h-auto">
            View All
          </Button>
        </div>

        <div className="space-y-3">
          {transactionsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border border-gray-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : recentTransactions.length === 0 ? (
            <Card className="border border-gray-100">
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">No transactions yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Add your first transaction to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            recentTransactions.map((transaction) => (
              <Card key={transaction.id} className="border border-gray-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getCategoryColor(transaction.category)}`}>
                        <span className="text-lg">{getCategoryIcon(transaction.category)}</span>
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                      </div>
                    </div>
                    <span
                      className={`font-semibold ${
                        transaction.type === "income" ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(parseFloat(transaction.amount))}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>

      {/* Spending Insights */}
      <section className="px-6 pb-6">
        <h3 className="text-lg font-semibold mb-4">Spending This Month</h3>
        <Card className="border border-gray-100">
          <CardContent className="p-4">
            {categoryLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : categorySpending && categorySpending.length > 0 ? (
              <div className="space-y-4">
                {categorySpending.slice(0, 3).map((item) => (
                  <div key={item.category}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm font-medium">{item.category}</span>
                      </div>
                      <span className="text-sm font-semibold">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-red-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(item.percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No spending data yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Add some expenses to see your spending breakdown
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Floating Action Button */}
      <Button
        onClick={() => setShowExpenseModal(true)}
        className="fixed bottom-20 right-6 w-14 h-14 bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg p-0 active:scale-95 transition-transform z-20"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Modals */}
      <AddFundsModal
        open={showFundsModal}
        onOpenChange={setShowFundsModal}
      />
      <AddExpenseModal
        open={showExpenseModal}
        onOpenChange={setShowExpenseModal}
      />
    </div>
  );
}

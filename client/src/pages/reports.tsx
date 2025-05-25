import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, TrendingUp, PieChart, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import type { Transaction } from "@shared/schema";

interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
}

export default function Reports() {
  const [timeRange, setTimeRange] = useState<string>("month");

  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: categorySpending, isLoading: categoryLoading } = useQuery<CategorySpending[]>({
    queryKey: ["/api/category-spending"],
  });

  const { data: balance, isLoading: balanceLoading } = useQuery<{
    balance: number;
    income: number;
    expenses: number;
  }>({
    queryKey: ["/api/balance"],
  });

  // Calculate spending trends
  const getSpendingByTimeRange = () => {
    if (!transactions) return { income: 0, expenses: 0, savings: 0 };

    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const filteredTransactions = transactions.filter(
      t => new Date(t.date) >= startDate
    );

    const income = filteredTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const expenses = filteredTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const savings = income - expenses;

    return { income, expenses, savings };
  };

  const timeRangeData = getSpendingByTimeRange();

  return (
    <div className="max-w-sm mx-auto bg-gray-50 min-h-screen pb-20">
      <div className="gradient-header text-white p-6 pt-12">
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-blue-100 mt-1">Analyze your spending patterns</p>
      </div>

      <div className="p-6 -mt-8 relative z-10 space-y-6">
        {/* Time Range Selector */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Time Range</span>
              </div>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
                Income
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {transactionsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold text-green-500">
                  {formatCurrency(timeRangeData.income)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-red-500 rotate-180" />
                Expenses
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {transactionsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold text-red-500">
                  {formatCurrency(timeRangeData.expenses)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <BarChart3 className="h-4 w-4 mr-2 text-blue-500" />
                Net Savings
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {transactionsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className={`text-2xl font-bold ${
                  timeRangeData.savings >= 0 ? "text-green-500" : "text-red-500"
                }`}>
                  {formatCurrency(timeRangeData.savings)}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <PieChart className="h-5 w-5 mr-2 text-purple-500" />
              Spending by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
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
                {categorySpending.map((item, index) => {
                  const colors = [
                    "bg-red-500",
                    "bg-blue-500", 
                    "bg-yellow-500",
                    "bg-green-500",
                    "bg-purple-500",
                    "bg-pink-500",
                    "bg-indigo-500"
                  ];
                  const color = colors[index % colors.length];
                  
                  return (
                    <div key={item.category}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 ${color} rounded-full`}></div>
                          <span className="text-sm font-medium">{item.category}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold">
                            {formatCurrency(item.amount)}
                          </span>
                          <p className="text-xs text-gray-500">
                            {item.percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`${color} h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${Math.min(item.percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No spending data available</p>
                <p className="text-sm text-gray-400 mt-1">
                  Add some expenses to see your breakdown
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction Count */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transaction Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Transactions</span>
                  <span className="font-medium">{transactions?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Income Transactions</span>
                  <span className="font-medium text-green-600">
                    {transactions?.filter(t => t.type === "income").length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Expense Transactions</span>
                  <span className="font-medium text-red-600">
                    {transactions?.filter(t => t.type === "expense").length || 0}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

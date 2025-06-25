import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Transaction } from "@/types";
import { formatDate } from "@/lib/utils";

interface AnalyticsPageProps {
  transactions: Transaction[];
  user: any;
}

interface CategoryAnalysis {
  category: string;
  total: number;
  count: number;
  average: number;
  percentage: number;
  trend: number;
  color: string;
}

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  balance: number;
  topCategory: string;
}

export function AnalyticsPage({ transactions, user }: AnalyticsPageProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [categoryAnalysis, setCategoryAnalysis] = useState<CategoryAnalysis[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [topSpendingDays, setTopSpendingDays] = useState<{ date: string; amount: number }[]>([]);
  const [insights, setInsights] = useState<string[]>([]);

  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  useEffect(() => {
    analyzeData();
  }, [transactions, selectedPeriod]);

  const analyzeData = () => {
    const now = new Date();
    const periodStart = new Date();
    
    switch (selectedPeriod) {
      case 'month':
        periodStart.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        periodStart.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        periodStart.setFullYear(now.getFullYear() - 1);
        break;
    }

    const filteredTransactions = transactions.filter(t => 
      new Date(t.date) >= periodStart && new Date(t.date) <= now
    );

    analyzeCategories(filteredTransactions);
    analyzeMonthlyTrends(filteredTransactions);
    analyzeSpendingDays(filteredTransactions);
    generateInsights(filteredTransactions);
  };

  const analyzeCategories = (transactions: Transaction[]) => {
    const categoryMap: { [key: string]: { total: number; count: number; amounts: number[] } } = {};

    transactions.forEach(transaction => {
      if (transaction.type === 'EXPENSE' && transaction.category) {
        if (!categoryMap[transaction.category]) {
          categoryMap[transaction.category] = { total: 0, count: 0, amounts: [] };
        }
        categoryMap[transaction.category].total += transaction.amount;
        categoryMap[transaction.category].count += 1;
        categoryMap[transaction.category].amounts.push(transaction.amount);
      }
    });

    const totalExpenses = Object.values(categoryMap).reduce((sum, cat) => sum + cat.total, 0);

    const analysis: CategoryAnalysis[] = Object.entries(categoryMap).map(([category, data], index) => {
      const average = data.total / data.count;
      const percentage = (data.total / totalExpenses) * 100;
      
      // Calculate trend (simple: compare first half vs second half of amounts)
      const sortedAmounts = data.amounts.sort((a, b) => a - b);
      const midPoint = Math.floor(sortedAmounts.length / 2);
      const firstHalf = sortedAmounts.slice(0, midPoint);
      const secondHalf = sortedAmounts.slice(midPoint);
      const firstHalfAvg = firstHalf.reduce((sum, amount) => sum + amount, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, amount) => sum + amount, 0) / secondHalf.length;
      const trend = secondHalfAvg - firstHalfAvg;

      return {
        category,
        total: data.total,
        count: data.count,
        average,
        percentage,
        trend,
        color: colors[index % colors.length]
      };
    });

    setCategoryAnalysis(analysis.sort((a, b) => b.total - a.total));
  };

  const analyzeMonthlyTrends = (transactions: Transaction[]) => {
    const monthlyMap: { [key: string]: { income: number; expenses: number; categories: { [key: string]: number } } } = {};

    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { income: 0, expenses: 0, categories: {} };
      }

      if (transaction.type === 'INCOME') {
        monthlyMap[monthKey].income += transaction.amount;
      } else {
        monthlyMap[monthKey].expenses += transaction.amount;
        if (transaction.category) {
          monthlyMap[monthKey].categories[transaction.category] = 
            (monthlyMap[monthKey].categories[transaction.category] || 0) + transaction.amount;
        }
      }
    });

    const monthlyData: MonthlyData[] = Object.entries(monthlyMap).map(([month, data]) => {
      const topCategory = Object.entries(data.categories)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

      return {
        month,
        income: data.income,
        expenses: data.expenses,
        balance: data.income - data.expenses,
        topCategory
      };
    });

    setMonthlyData(monthlyData.sort((a, b) => a.month.localeCompare(b.month)));
  };

  const analyzeSpendingDays = (transactions: Transaction[]) => {
    const dayMap: { [key: string]: number } = {};

    transactions.forEach(transaction => {
      if (transaction.type === 'EXPENSE') {
        const date = new Date(transaction.date).toISOString().split('T')[0];
        dayMap[date] = (dayMap[date] || 0) + transaction.amount;
      }
    });

    const topDays = Object.entries(dayMap)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([date, amount]) => ({ date, amount }));

    setTopSpendingDays(topDays);
  };

  const generateInsights = (transactions: Transaction[]) => {
    const insights: string[] = [];
    const expenses = transactions.filter(t => t.type === 'EXPENSE');
    const income = transactions.filter(t => t.type === 'INCOME');

    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    // Spending rate insights
    if (savingsRate < 0) {
      insights.push("⚠️ You're spending more than you earn. Consider reducing expenses.");
    } else if (savingsRate < 20) {
      insights.push("💡 Your savings rate is below 20%. Try to increase your savings.");
    } else if (savingsRate > 50) {
      insights.push("🎉 Excellent! You're saving more than 50% of your income.");
    }

    // Category insights
    const topCategory = categoryAnalysis[0];
    if (topCategory && topCategory.percentage > 40) {
      insights.push(`📊 ${topCategory.category} accounts for ${topCategory.percentage.toFixed(1)}% of your spending.`);
    }

    // Frequency insights
    const avgTransactionsPerDay = expenses.length / 30; // Assuming monthly view
    if (avgTransactionsPerDay > 3) {
      insights.push("🔄 You make many small transactions. Consider consolidating purchases.");
    }

    // Trend insights
    const increasingCategories = categoryAnalysis.filter(cat => cat.trend > 0);
    if (increasingCategories.length > 0) {
      insights.push(`📈 ${increasingCategories[0].category} spending is trending upward.`);
    }

    setInsights(insights);
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'month': return 'Last Month';
      case 'quarter': return 'Last 3 Months';
      case 'year': return 'Last Year';
    }
  };

  const totalIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Spending Analytics</h1>
          <p className="text-gray-400">
            Detailed analysis of your financial patterns and trends
          </p>
        </div>
        <div className="flex gap-2">
          {(['month', 'quarter', 'year'] as const).map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Income</p>
                <p className="text-2xl font-bold text-blue-400">
                  ${totalIncome.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Expenses</p>
                <p className="text-2xl font-bold text-red-400">
                  ${totalExpenses.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">💸</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Net Balance</p>
                <p className={`text-2xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                  ${(totalIncome - totalExpenses).toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Savings Rate</p>
                <p className="text-2xl font-bold text-purple-400">
                  {totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Analysis */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-white">Spending by Category ({getPeriodLabel()})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryAnalysis.map((category, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <div>
                    <h3 className="font-semibold text-white">{category.category}</h3>
                    <p className="text-gray-400 text-sm">
                      {category.count} transactions • ${category.average.toFixed(2)} avg
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold">${category.total.toFixed(2)}</p>
                  <p className="text-gray-400 text-sm">{category.percentage.toFixed(1)}%</p>
                  <Badge className={category.trend > 0 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}>
                    {category.trend > 0 ? '↗️' : '↘️'} {Math.abs(category.trend).toFixed(0)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-white">Monthly Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyData.map((month, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-white">{month.month}</h4>
                    <p className="text-gray-400 text-sm">Top: {month.topCategory}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 text-sm">+${month.income.toFixed(2)}</p>
                    <p className="text-red-400 text-sm">-${month.expenses.toFixed(2)}</p>
                    <p className={`font-bold ${month.balance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                      ${month.balance.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-white">Top Spending Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topSpendingDays.map((day, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                      <span className="text-red-400 font-bold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{formatDate(new Date(day.date))}</h4>
                      <p className="text-gray-400 text-sm">{day.date}</p>
                    </div>
                  </div>
                  <p className="text-red-400 font-bold">${day.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <span className="text-2xl">💡</span>
              Smart Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.map((insight, index) => (
                <div key={index} className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-white text-sm">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Spending Chart Placeholder */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-white">Spending Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Interactive Charts Coming Soon</h3>
              <p className="text-gray-400">Advanced visualizations and trend analysis will be available soon.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
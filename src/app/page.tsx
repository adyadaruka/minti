"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useCalendar } from "@/hooks/useCalendar";
import { useTransactions } from "@/hooks/useTransactions";
import { LoginScreen } from "@/features/auth/LoginScreen";
import { Dashboard } from "@/features/budget/Dashboard";
import { PredictionsPage } from "@/features/predictions/PredictionsPage";
import { AnalyticsPage } from "@/features/analytics/AnalyticsPage";
import { AccountsPage } from "@/features/accounts/AccountsPage";
import { Sidebar } from "@/components/Sidebar";
import { LoadingScreen } from "@/components/LoadingScreen";
import { User, CalendarEvent, Transaction, BudgetGoal, BillReminder, SavingsGoal, TransactionFormData, BudgetGoalFormData, BillReminderFormData, SavingsGoalFormData } from "@/types";
import { APP_CONFIG } from "@/constants";

export default function Home() {
  const { user, login, logout, loading: authLoading, getAccessToken } = useAuth();
  const { events, syncing: calendarSyncing, error: calendarError, syncCalendar } = useCalendar(user);
  const { transactions, addTransaction, loading: transactionsLoading } = useTransactions(user);
  
  // New state for advanced features
  const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>([]);
  const [billReminders, setBillReminders] = useState<BillReminder[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');

  // Load data when user changes
  useEffect(() => {
    if (user) {
      loadAllData();
      // Auto-sync calendar when user is authenticated
      const accessToken = getAccessToken();
      if (accessToken) {
        syncCalendar(accessToken);
      }
    }
  }, [user, getAccessToken, syncCalendar]);

  const loadAllData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load budget goals
      const goalsResponse = await fetch(`/api/budget-goals?userId=${user.id}`);
      if (goalsResponse.ok) {
        const goals = await goalsResponse.json();
        setBudgetGoals(goals);
      }

      // Load bill reminders
      const billsResponse = await fetch(`/api/bill-reminders?userId=${user.id}`);
      if (billsResponse.ok) {
        const bills = await billsResponse.json();
        setBillReminders(bills);
      }

      // Load savings goals
      const savingsResponse = await fetch(`/api/savings-goals?userId=${user.id}`);
      if (savingsResponse.ok) {
        const savings = await savingsResponse.json();
        setSavingsGoals(savings);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBudgetGoal = async (data: BudgetGoalFormData) => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/budget-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          userId: user.id,
        }),
      });

      if (response.ok) {
        const newGoal = await response.json();
        setBudgetGoals(prev => [newGoal, ...prev]);
      } else {
        throw new Error('Failed to add budget goal');
      }
    } catch (error) {
      console.error('Failed to add budget goal:', error);
      throw error;
    }
  };

  const handleAddBillReminder = async (data: BillReminderFormData) => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/bill-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          userId: user.id,
        }),
      });

      if (response.ok) {
        const newBill = await response.json();
        setBillReminders(prev => [newBill, ...prev]);
      } else {
        throw new Error('Failed to add bill reminder');
      }
    } catch (error) {
      console.error('Failed to add bill reminder:', error);
      throw error;
    }
  };

  const handleMarkBillAsPaid = async (id: string) => {
    try {
      const response = await fetch(`/api/bill-reminders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaid: true }),
      });

      if (response.ok) {
        setBillReminders(prev => 
          prev.map(bill => 
            bill.id === id ? { ...bill, isPaid: true } : bill
          )
        );
      } else {
        throw new Error('Failed to mark bill as paid');
      }
    } catch (error) {
      console.error('Failed to mark bill as paid:', error);
      throw error;
    }
  };

  const handleAddSavingsGoal = async (data: SavingsGoalFormData) => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/savings-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          userId: user.id,
        }),
      });

      if (response.ok) {
        const newGoal = await response.json();
        setSavingsGoals(prev => [newGoal, ...prev]);
      } else {
        throw new Error('Failed to add savings goal');
      }
    } catch (error) {
      console.error('Failed to add savings goal:', error);
      throw error;
    }
  };

  const handleAddTransaction = async (data: TransactionFormData) => {
    try {
      const result = await addTransaction(data);
      return result;
    } catch (error) {
      console.error('Failed to add transaction:', error);
      throw error;
    }
  };

  // Calculate totals
  const totals = {
    income: transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0),
    expenses: transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0),
    balance: transactions
      .reduce((sum, t) => sum + (t.type === 'INCOME' ? t.amount : -t.amount), 0),
  };

  // Calculate stats for sidebar
  const sidebarStats = {
    totalBalance: totals.balance,
    monthlySpending: totals.expenses,
    upcomingBills: billReminders
      .filter(bill => !bill.isPaid)
      .reduce((sum, bill) => sum + bill.amount, 0),
    activeGoals: budgetGoals.filter(goal => goal.isActive).length,
  };

  // Render page content based on active page
  const renderPageContent = () => {
    if (!user) return null;
    
    switch (activePage) {
      case 'dashboard':
        return (
          <Dashboard
            user={user}
            events={events}
            transactions={transactions}
            budgetGoals={budgetGoals}
            billReminders={billReminders}
            savingsGoals={savingsGoals}
            totals={totals}
            syncing={calendarSyncing || transactionsLoading || loading}
            error={calendarError}
            onLogout={logout}
            onAddTransaction={handleAddTransaction}
            onAddBudgetGoal={handleAddBudgetGoal}
            onAddBillReminder={handleAddBillReminder}
            onMarkBillAsPaid={handleMarkBillAsPaid}
            onAddSavingsGoal={handleAddSavingsGoal}
          />
        );
      case 'predictions':
        return (
          <PredictionsPage
            events={events}
            transactions={transactions}
            user={user}
          />
        );
      case 'analytics':
        return (
          <AnalyticsPage
            transactions={transactions}
            user={user}
          />
        );
      case 'accounts':
        return (
          <AccountsPage
            user={user}
          />
        );
      case 'goals':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Financial Goals</h1>
              <p className="text-gray-400">Track your progress towards financial milestones</p>
            </div>
            {/* Goals content would go here */}
            <div className="text-center py-12">
              <p className="text-gray-400">Goals page content coming soon...</p>
            </div>
          </div>
        );
      case 'bills':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Bill Management</h1>
              <p className="text-gray-400">Manage your recurring bills and payments</p>
            </div>
            {/* Bills content would go here */}
            <div className="text-center py-12">
              <p className="text-gray-400">Bills page content coming soon...</p>
            </div>
          </div>
        );
      case 'transactions':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Transactions</h1>
              <p className="text-gray-400">View and manage all your financial transactions</p>
            </div>
            {/* Transactions content would go here */}
            <div className="text-center py-12">
              <p className="text-gray-400">Transactions page content coming soon...</p>
            </div>
          </div>
        );
      case 'budget':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Budget Planning</h1>
              <p className="text-gray-400">Set and track your spending limits</p>
            </div>
            {/* Budget content would go here */}
            <div className="text-center py-12">
              <p className="text-gray-400">Budget page content coming soon...</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
              <p className="text-gray-400">Configure your account and preferences</p>
            </div>
            {/* Settings content would go here */}
            <div className="text-center py-12">
              <p className="text-gray-400">Settings page content coming soon...</p>
            </div>
          </div>
        );
      default:
        return (
          <Dashboard
            user={user}
            events={events}
            transactions={transactions}
            budgetGoals={budgetGoals}
            billReminders={billReminders}
            savingsGoals={savingsGoals}
            totals={totals}
            syncing={calendarSyncing || transactionsLoading || loading}
            error={calendarError}
            onLogout={logout}
            onAddTransaction={handleAddTransaction}
            onAddBudgetGoal={handleAddBudgetGoal}
            onAddBillReminder={handleAddBillReminder}
            onMarkBillAsPaid={handleMarkBillAsPaid}
            onAddSavingsGoal={handleAddSavingsGoal}
          />
        );
    }
  };

  // Show loading screen while auth is loading
  if (authLoading) {
    return <LoadingScreen />;
  }

  // Show login screen if not authenticated
  if (!user) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900"
        >
          <LoginScreen onLogin={login} />
        </motion.div>
      </AnimatePresence>
    );
  }

  // Show main app with sidebar if authenticated
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="app"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900"
      >
        {/* Sidebar */}
        <Sidebar
          activePage={activePage}
          onPageChange={setActivePage}
          user={user || { id: '', name: '', email: '' }}
          stats={sidebarStats}
        />

        {/* Main Content */}
        <div className="ml-64 p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderPageContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

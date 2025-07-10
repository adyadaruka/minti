import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tooltip, TooltipProvider } from '@radix-ui/react-tooltip';
import { HomeIcon, IdCardIcon, ContainerIcon, CalendarIcon, BarChartIcon, GearIcon, LightningBoltIcon, ChartPieIcon, ValueIcon, TargetIcon, BellIcon } from '@radix-ui/react-icons';

interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
  user: User | null;
  stats: {
    totalBalance: number;
    monthlySpending: number;
    upcomingBills: number;
    activeGoals: number;
  };
  onLogout: () => void;
  onNotificationsClick: () => void;
}

export function Sidebar({ activePage, onPageChange, user, stats, onLogout, onNotificationsClick }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const quickStats = [
    {
      label: 'Balance',
      value: `$${stats.totalBalance.toFixed(2)}`,
      color: stats.totalBalance >= 0 ? 'text-green-400' : 'text-red-400'
    },
    {
      label: 'This Month',
      value: `$${stats.monthlySpending.toFixed(2)}`,
      color: 'text-blue-400'
    },
    {
      label: 'Upcoming',
      value: `$${stats.upcomingBills.toFixed(2)}`,
      color: 'text-orange-400'
    }
  ];

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: HomeIcon, href: '/' },
    { id: 'predictions', label: 'Predictions', icon: LightningBoltIcon, href: '/predictions' },
    { id: 'analytics', label: 'Analytics', icon: BarChartIcon, href: '/analytics' },
    { id: 'calendar-insights', label: 'Calendar Insights', icon: CalendarIcon, href: '/calendar-insights' },
    { id: 'accounts', label: 'Accounts', icon: IdCardIcon, href: '/accounts' },
  ];

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <HomeIcon />, description: 'Overview & Analytics' },
    { id: 'transactions', label: 'Transactions', icon: <IdCardIcon />, description: 'View & Manage' },
    { id: 'budget', label: 'Budget', icon: <ContainerIcon />, description: 'Set & Track Limits' },
    { id: 'goals', label: 'Goals', icon: <TargetIcon />, description: 'Financial Goals' },
    { id: 'bills', label: 'Bills', icon: <CalendarIcon />, description: 'Bill Reminders' },
    { id: 'predictions', label: 'Predictions', icon: <LightningBoltIcon />, description: 'AI Spending Forecast' },
    { id: 'analytics', label: 'Analytics', icon: <BarChartIcon />, description: 'Spending Analysis' },
    { id: 'calendar-insights', label: 'Calendar Insights', icon: <CalendarIcon />, description: 'Smart Calendar Analysis' },
    { id: 'accounts', label: 'Accounts', icon: <ValueIcon />, description: 'Bank Connections' },
    { id: 'notifications', label: 'Notifications', icon: <BellIcon />, description: 'Alerts & Reminders', onClick: onNotificationsClick },
    { id: 'settings', label: 'Settings', icon: <GearIcon />, description: 'App Configuration' },
  ];

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className={`fixed left-0 top-0 h-full bg-card/80 backdrop-blur-xl border-r border-border z-40 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} flex flex-col`}
      aria-label="Sidebar Navigation"
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <div>
              <h1 className="text-foreground font-bold text-lg">Minty</h1>
              <p className="text-gray-400 text-xs">Smart Budgeting</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-accent"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '→' : '←'}
        </Button>
      </div>

      {/* Quick Stats */}
      {!collapsed && (
        <div className="p-4 border-b border-border flex gap-2 justify-between">
          {quickStats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <span className={`font-bold ${stat.color}`}>{stat.value}</span>
              <span className="text-xs text-gray-400">{stat.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Navigation */}
      <TooltipProvider delayDuration={0}>
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {menuItems.map((item) => (
            <Tooltip key={item.id} content={item.label} delayDuration={0}>
              <button
                onClick={() => {
                  if (item.onClick) {
                    item.onClick();
                  } else {
                    onPageChange(item.id);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-accent ${
                  activePage === item.id
                    ? 'bg-accent/20 text-accent border border-accent'
                    : 'text-foreground hover:text-accent hover:bg-accent/10'
                }`}
                aria-label={item.label}
              >
                <span className="text-xl">{item.icon}</span>
                {!collapsed && (
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className="text-xs opacity-60">{item.description}</div>
                  </div>
                )}
                {activePage === item.id && !collapsed && (
                  <Badge className="bg-accent text-white text-xs">Active</Badge>
                )}
              </button>
            </Tooltip>
          ))}
        </nav>
      </TooltipProvider>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-border">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-400">🎯</span>
              <span className="text-foreground text-sm font-medium">Active Goals</span>
            </div>
            <p className="text-gray-400 text-xs">
              {stats.activeGoals} goals in progress
            </p>
          </div>
        </div>
      )}
    </motion.aside>
  );
} 
"use client";
import { useState, useEffect } from 'react';
import { CalendarEvent, User } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CATEGORY_COLORS } from '@/constants';

interface CalendarInsightsPageProps {
  user: User;
  events: CalendarEvent[];
}

interface CalendarInsights {
  totalEvents: number;
  upcomingEvents: number;
  todayEvents: number;
  tomorrowEvents: number;
  categories: Record<string, number>;
  spendingPredictions: {
    totalPredictedSpending: number;
    highSpendingEvents: number;
    weeklyBreakdown: Record<string, number>;
    topSpendingCategories: Array<{ category: string; amount: number }>;
  };
  timeAnalysis: {
    morningEvents: number;
    afternoonEvents: number;
    eveningEvents: number;
    weekendEvents: number;
  };
  recommendations: Array<{
    type: 'warning' | 'info' | 'success';
    title: string;
    message: string;
    events?: Array<{ title: string; date: string }>;
  }>;
}

export function CalendarInsightsPage({ user, events }: CalendarInsightsPageProps) {
  const [insights, setInsights] = useState<CalendarInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInsights();
  }, [user]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/calendar-insights?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setInsights(data);
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesCategory = activeFilter === 'all' || event.category === activeFilter;
    const matchesSearch = !searchTerm || 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Calendar Insights</h1>
          <p className="text-gray-400">Smart analysis of your calendar events and spending predictions</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 justify-center">
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            {Object.keys(insights?.categories || {}).map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Insights Grid */}
        {insights && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="glass">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-400">{insights.totalEvents}</div>
                <div className="text-gray-400">Total Events</div>
              </CardContent>
            </Card>
            
            <Card className="glass">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-400">{insights.upcomingEvents}</div>
                <div className="text-gray-400">Upcoming Events</div>
              </CardContent>
            </Card>
            
            <Card className="glass">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-yellow-400">{insights.todayEvents}</div>
                <div className="text-gray-400">Today's Events</div>
              </CardContent>
            </Card>
            
            <Card className="glass">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-purple-400">{insights.tomorrowEvents}</div>
                <div className="text-gray-400">Tomorrow's Events</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Spending Predictions */}
        {insights && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="glass">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4">Spending Predictions</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Predicted Spending:</span>
                    <span className="font-bold text-green-400">
                      {formatCurrency(insights.spendingPredictions.totalPredictedSpending)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>High Spending Events:</span>
                    <span className="font-bold text-red-400">
                      {insights.spendingPredictions.highSpendingEvents}
                    </span>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Top Spending Categories</h4>
                  <div className="space-y-2">
                    {insights.spendingPredictions.topSpendingCategories.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span>{item.category}</span>
                        <span className="font-bold">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4">Time Analysis</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Morning Events:</span>
                    <span className="font-bold text-orange-400">{insights.timeAnalysis.morningEvents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Afternoon Events:</span>
                    <span className="font-bold text-blue-400">{insights.timeAnalysis.afternoonEvents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Evening Events:</span>
                    <span className="font-bold text-purple-400">{insights.timeAnalysis.eveningEvents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weekend Events:</span>
                    <span className="font-bold text-green-400">{insights.timeAnalysis.weekendEvents}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recommendations */}
        {insights && insights.recommendations.length > 0 && (
          <Card className="glass">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">Smart Recommendations</h3>
              <div className="space-y-4">
                {insights.recommendations.map((rec, index) => (
                  <div key={index} className={`p-4 rounded-lg border-l-4 ${
                    rec.type === 'warning' ? 'bg-red-900/20 border-red-500' :
                    rec.type === 'info' ? 'bg-blue-900/20 border-blue-500' :
                    'bg-green-900/20 border-green-500'
                  }`}>
                    <h4 className="font-semibold mb-2">{rec.title}</h4>
                    <p className="text-gray-300 mb-3">{rec.message}</p>
                    {rec.events && (
                      <div className="space-y-1">
                        {rec.events.map((event, eventIndex) => (
                          <div key={eventIndex} className="text-sm text-gray-400">
                            • {event.title} - {formatDate(event.date)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtered Events List */}
        <Card className="glass">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-4">
              Events ({filteredEvents.length})
              {activeFilter !== 'all' && ` - ${activeFilter}`}
            </h3>
            
            {filteredEvents.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredEvents.map((event) => (
                  <div key={event.id} className="flex justify-between items-center p-4 bg-gray-800 rounded-lg">
                    <div className="space-y-2">
                      <h4 className="font-semibold">{event.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge className={CATEGORY_COLORS[event.category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.Other}>
                          {event.category}
                        </Badge>
                        <span className="text-sm text-gray-400">
                          {formatDate(event.start)}
                        </span>
                      </div>
                      {event.spendingProbability && event.spendingProbability > 0.3 && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                          <span className="text-sm text-yellow-400">
                            {(event.spendingProbability * 100).toFixed(0)}% spending chance
                          </span>
                          {event.expectedSpendingRange && (
                            <span className="text-sm text-gray-400">
                              ${event.expectedSpendingRange[0]}-${event.expectedSpendingRange[1]}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                No events found with the current filters.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
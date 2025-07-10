"use client";
import { useState, useEffect } from 'react';
import { User } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface SpendingForecastProps {
  user: User;
}

interface SpendingForecast {
  timeframe: string;
  totalEvents: number;
  spendingAnalysis: {
    totalPredictedSpending: number;
    highSpendingEvents: number;
    lowSpendingEvents: number;
    categoryBreakdown: Record<string, number>;
    timeBreakdown: {
      morning: number;
      afternoon: number;
      evening: number;
      weekend: number;
    };
  };
  predictions: {
    totalSpending: number;
    dailyAverage: number;
    weeklyAverage: number;
    peakSpendingDay: string | null;
    peakSpendingAmount: number;
    categoryPredictions: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
  };
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    score: number;
    factors: string[];
    warnings: string[];
  };
  recommendations: Array<{
    type: 'warning' | 'info' | 'success';
    title: string;
    message: string;
    priority: string;
  }>;
}

export function SpendingForecast({ user }: SpendingForecastProps) {
  const [forecast, setForecast] = useState<SpendingForecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('week');

  useEffect(() => {
    fetchForecast();
  }, [user, timeframe]);

  const fetchForecast = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/predictions/spending-forecast?userId=${user.id}&timeframe=${timeframe}`);
      if (response.ok) {
        const data = await response.json();
        setForecast(data);
      }
    } catch (error) {
      console.error('Failed to fetch forecast:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  const getRiskBgColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-900/20 border-red-500';
      case 'medium':
        return 'bg-yellow-900/20 border-yellow-500';
      case 'low':
        return 'bg-green-900/20 border-green-500';
      default:
        return 'bg-gray-900/20 border-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!forecast) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>No forecast data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Spending Forecast</h2>
          <p className="text-gray-400">AI-powered spending predictions based on your calendar</p>
        </div>
        <div className="flex gap-2">
          {['week', 'month', 'quarter'].map((tf) => (
            <Button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-2 rounded-lg ${
                timeframe === tf
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tf.charAt(0).toUpperCase() + tf.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-400">
              {formatCurrency(forecast.predictions.totalSpending)}
            </div>
            <div className="text-gray-400">Total Predicted</div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-400">
              {formatCurrency(forecast.predictions.dailyAverage)}
            </div>
            <div className="text-gray-400">Daily Average</div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-400">
              {forecast.spendingAnalysis.highSpendingEvents}
            </div>
            <div className="text-gray-400">High Spending Events</div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6 text-center">
            <div className={`text-3xl font-bold ${getRiskColor(forecast.riskAssessment.level)}`}>
              {forecast.riskAssessment.score}%
            </div>
            <div className="text-gray-400">Risk Score</div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Assessment */}
      <Card className="glass">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4">Risk Assessment</h3>
          <div className={`p-4 rounded-lg border-l-4 ${getRiskBgColor(forecast.riskAssessment.level)}`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-white">Risk Level: {forecast.riskAssessment.level.toUpperCase()}</h4>
              <Badge className={`${getRiskColor(forecast.riskAssessment.level)}`}>
                Score: {forecast.riskAssessment.score}%
              </Badge>
            </div>
            
            {forecast.riskAssessment.factors.length > 0 && (
              <div className="mb-3">
                <h5 className="font-medium text-gray-300 mb-2">Risk Factors:</h5>
                <ul className="space-y-1">
                  {forecast.riskAssessment.factors.map((factor, index) => (
                    <li key={index} className="text-sm text-gray-400">• {factor}</li>
                  ))}
                </ul>
              </div>
            )}

            {forecast.riskAssessment.warnings.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-300 mb-2">Recommendations:</h5>
                <ul className="space-y-1">
                  {forecast.riskAssessment.warnings.map((warning, index) => (
                    <li key={index} className="text-sm text-gray-400">• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="glass">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-4">Category Breakdown</h3>
            <div className="space-y-3">
              {forecast.predictions.categoryPredictions.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-300">{category.category}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-white">{formatCurrency(category.amount)}</div>
                    <div className="text-sm text-gray-400">{category.percentage.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-4">Time Analysis</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Morning (6AM-12PM):</span>
                <span className="font-bold text-orange-400">
                  {formatCurrency(forecast.spendingAnalysis.timeBreakdown.morning)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Afternoon (12PM-6PM):</span>
                <span className="font-bold text-blue-400">
                  {formatCurrency(forecast.spendingAnalysis.timeBreakdown.afternoon)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Evening (6PM-6AM):</span>
                <span className="font-bold text-purple-400">
                  {formatCurrency(forecast.spendingAnalysis.timeBreakdown.evening)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Weekend:</span>
                <span className="font-bold text-green-400">
                  {formatCurrency(forecast.spendingAnalysis.timeBreakdown.weekend)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {forecast.recommendations.length > 0 && (
        <Card className="glass">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-4">Smart Recommendations</h3>
            <div className="space-y-4">
              {forecast.recommendations.map((rec, index) => (
                <div key={index} className={`p-4 rounded-lg border-l-4 ${
                  rec.type === 'warning' ? 'bg-red-900/20 border-red-500' :
                  rec.type === 'info' ? 'bg-blue-900/20 border-blue-500' :
                  'bg-green-900/20 border-green-500'
                }`}>
                  <h4 className="font-semibold mb-2">{rec.title}</h4>
                  <p className="text-gray-300">{rec.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Peak Spending Day */}
      {forecast.predictions.peakSpendingDay && (
        <Card className="glass">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-4">Peak Spending Day</h3>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400 mb-2">
                {formatDate(forecast.predictions.peakSpendingDay)}
              </div>
              <div className="text-lg text-gray-300">
                Expected spending: {formatCurrency(forecast.predictions.peakSpendingAmount)}
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Plan your budget accordingly for this high-spending day.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CalendarEvent, Transaction } from "@/types";
import { formatDate } from "@/lib/utils";
import { SpendingForecast } from '@/components/SpendingForecast';

interface PredictionsPageProps {
  events: CalendarEvent[];
  transactions: Transaction[];
  user: any;
}

interface PredictionResult {
  category: string;
  predictedAmount: number;
  confidence: number;
  factors: string[];
  trend: 'increasing' | 'decreasing' | 'stable';
  nextOccurrence?: Date;
}

interface SpendingPattern {
  category: string;
  averageAmount: number;
  frequency: number;
  lastTransaction?: Date;
  trend: number;
}

export function PredictionsPage({ events, transactions, user }: PredictionsPageProps) {
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [patterns, setPatterns] = useState<SpendingPattern[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    analyzeSpendingPatterns();
    generatePredictions();
  }, [transactions, events, timeframe]);

  const analyzeSpendingPatterns = () => {
    const categoryData: { [key: string]: { amounts: number[], dates: Date[] } } = {};

    // Group transactions by category
    transactions.forEach(transaction => {
      if (transaction.type === 'EXPENSE' && transaction.category) {
        if (!categoryData[transaction.category]) {
          categoryData[transaction.category] = { amounts: [], dates: [] };
        }
        categoryData[transaction.category].amounts.push(transaction.amount);
        categoryData[transaction.category].dates.push(new Date(transaction.date));
      }
    });

    const patterns: SpendingPattern[] = Object.entries(categoryData).map(([category, data]) => {
      const averageAmount = data.amounts.reduce((sum, amount) => sum + amount, 0) / data.amounts.length;
      const sortedDates = data.dates.sort((a, b) => b.getTime() - a.getTime());
      const lastTransaction = sortedDates[0];
      
      // Calculate frequency (transactions per month)
      const timeSpan = sortedDates.length > 1 
        ? (sortedDates[0].getTime() - sortedDates[sortedDates.length - 1].getTime()) / (1000 * 60 * 60 * 24 * 30)
        : 1;
      const frequency = sortedDates.length / Math.max(timeSpan, 1);

      // Calculate trend (positive = increasing, negative = decreasing)
      const recentAmounts = data.amounts.slice(0, Math.min(3, data.amounts.length));
      const olderAmounts = data.amounts.slice(-Math.min(3, data.amounts.length));
      const recentAvg = recentAmounts.reduce((sum, amount) => sum + amount, 0) / recentAmounts.length;
      const olderAvg = olderAmounts.reduce((sum, amount) => sum + amount, 0) / olderAmounts.length;
      const trend = recentAvg - olderAvg;

      return {
        category,
        averageAmount,
        frequency,
        lastTransaction,
        trend
      };
    });

    setPatterns(patterns.sort((a, b) => b.averageAmount - a.averageAmount));
  };

  const generatePredictions = () => {
    setLoading(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const predictions: PredictionResult[] = patterns.map(pattern => {
        const baseAmount = pattern.averageAmount;
        const timeframeMultiplier = timeframe === 'week' ? 0.25 : timeframe === 'month' ? 1 : 3;
        const trendAdjustment = pattern.trend * 0.1;
        
        let predictedAmount = (baseAmount * pattern.frequency * timeframeMultiplier) + trendAdjustment;
        predictedAmount = Math.max(predictedAmount, 0);

        // Calculate confidence based on data quality
        const dataPoints = transactions.filter(t => t.category === pattern.category).length;
        const confidence = Math.min(0.95, 0.3 + (dataPoints * 0.1));

        // Determine trend direction
        let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
        if (pattern.trend > 10) trend = 'increasing';
        else if (pattern.trend < -10) trend = 'decreasing';

        // Predict next occurrence
        const nextOccurrence = pattern.lastTransaction 
          ? new Date(pattern.lastTransaction.getTime() + (30 / pattern.frequency) * 24 * 60 * 60 * 1000)
          : undefined;

        const factors = [];
        if (pattern.frequency > 2) factors.push('High frequency spending');
        if (pattern.trend > 0) factors.push('Increasing trend');
        if (dataPoints > 5) factors.push('Strong historical data');
        if (pattern.averageAmount > 100) factors.push('High-value category');

        return {
          category: pattern.category,
          predictedAmount,
          confidence,
          factors,
          trend,
          nextOccurrence
        };
      });

      // Add event-based predictions
      const eventPredictions = events
        .filter(event => event.spendingProbability && event.spendingProbability > 0.5)
        .map(event => {
          const avgExpected = event.expectedSpendingRange 
            ? (event.expectedSpendingRange[0] + event.expectedSpendingRange[1]) / 2
            : 50;
          
          return {
            category: event.category,
            predictedAmount: avgExpected * (event.spendingProbability || 0.5),
            confidence: event.spendingProbability || 0.5,
            factors: ['Calendar event', 'High spending probability'],
            trend: 'stable' as const,
            nextOccurrence: new Date(event.start)
          };
        });

      setPredictions([...predictions, ...eventPredictions]);
      setLoading(false);
    }, 1500);
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'text-red-400';
      case 'decreasing': return 'text-green-400';
      default: return 'text-blue-400';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      default: return '➡️';
    }
  };

  const filteredPredictions = selectedCategory === 'all' 
    ? predictions 
    : predictions.filter(p => p.category === selectedCategory);

  const totalPredicted = filteredPredictions.reduce((sum, p) => sum + p.predictedAmount, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">AI Spending Predictions</h1>
          <p className="text-gray-400">
            Advanced AI analysis of your spending patterns and calendar events
          </p>
        </div>
        <Button
          onClick={generatePredictions}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Analyzing...
            </div>
          ) : (
            '🔮 Generate Predictions'
          )}
        </Button>
      </div>

      {/* Spending Forecast */}
      <SpendingForecast user={user} />

      {/* Controls */}
      <div className="flex gap-4 items-center">
        <div className="flex gap-2">
          {(['week', 'month', 'quarter'] as const).map((period) => (
            <Button
              key={period}
              variant={timeframe === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeframe(period)}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Button>
          ))}
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
        >
          <option value="all">All Categories</option>
          {Array.from(new Set(predictions.map(p => p.category))).map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Predicted</p>
                <p className="text-2xl font-bold text-purple-400">
                  ${totalPredicted.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🔮</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Categories</p>
                <p className="text-2xl font-bold text-blue-400">
                  {filteredPredictions.length}
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
                <p className="text-gray-400 text-sm">Avg Confidence</p>
                <p className="text-2xl font-bold text-blue-400">
                  {(filteredPredictions.reduce((sum, p) => sum + p.confidence, 0) / Math.max(filteredPredictions.length, 1) * 100).toFixed(0)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Event-Based</p>
                <p className="text-2xl font-bold text-orange-400">
                  {predictions.filter(p => p.factors.includes('Calendar event')).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Predictions List */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white">Detailed Predictions</h2>
        
        {filteredPredictions.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPredictions.map((prediction, index) => (
              <Card key={index} className="glass hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-white text-lg">{prediction.category}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/20">
                          {(prediction.confidence * 100).toFixed(0)}% confidence
                        </Badge>
                        <div className="flex items-center gap-1">
                          <span>{getTrendIcon(prediction.trend)}</span>
                          <span className={`text-sm ${getTrendColor(prediction.trend)}`}>
                            {prediction.trend}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-400">
                        ${prediction.predictedAmount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {timeframe}ly prediction
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Prediction Factors:</p>
                      <div className="flex flex-wrap gap-1">
                        {prediction.factors.map((factor, factorIndex) => (
                          <Badge key={factorIndex} className="bg-gray-600/20 text-gray-300 border-gray-600/20 text-xs">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {prediction.nextOccurrence && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Next Expected:</span>
                        <span className="text-white font-medium">
                          {formatDate(prediction.nextOccurrence)}
                        </span>
                      </div>
                    )}

                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                        style={{ width: `${prediction.confidence * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="glass">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔮</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Predictions Yet</h3>
              <p className="text-gray-400 mb-4">
                Generate AI predictions based on your spending patterns and calendar events.
              </p>
              <Button onClick={generatePredictions} className="bg-purple-600 hover:bg-purple-700">
                Generate Predictions
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* AI Insights */}
      {predictions.length > 0 && (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              AI Insights & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-white">Spending Patterns</h4>
                <div className="space-y-3">
                  {patterns.slice(0, 3).map((pattern, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{pattern.category}</p>
                        <p className="text-gray-400 text-sm">
                          ${pattern.averageAmount.toFixed(2)} avg • {pattern.frequency.toFixed(1)}x/month
                        </p>
                      </div>
                      <Badge className={pattern.trend > 0 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}>
                        {pattern.trend > 0 ? '↗️' : '↘️'} {Math.abs(pattern.trend).toFixed(0)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-white">Smart Recommendations</h4>
                <div className="space-y-3">
                  {predictions
                    .filter(p => p.trend === 'increasing' && p.predictedAmount > 100)
                    .slice(0, 3)
                    .map((prediction, index) => (
                      <div key={index} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-red-400 font-medium text-sm">
                          ⚠️ Monitor {prediction.category} spending
                        </p>
                        <p className="text-gray-400 text-xs">
                          Predicted to increase by ${prediction.predictedAmount.toFixed(2)} this {timeframe}
                        </p>
                      </div>
                    ))}
                  
                  {predictions
                    .filter(p => p.confidence > 0.8)
                    .slice(0, 2)
                    .map((prediction, index) => (
                      <div key={index} className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <p className="text-blue-400 font-medium text-sm">
                          ✅ High confidence prediction
                        </p>
                        <p className="text-gray-400 text-xs">
                          {prediction.category}: ${prediction.predictedAmount.toFixed(2)}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
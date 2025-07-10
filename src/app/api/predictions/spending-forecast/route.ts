import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { addDays, startOfDay, endOfDay, format, isToday, isTomorrow, isThisWeek, isNextWeek } from 'date-fns';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const timeframe = searchParams.get("timeframe") || "week"; // week, month, quarter
    
    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId parameter" }, 
        { status: 400 }
      );
    }

    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    // Set timeframe
    switch (timeframe) {
      case "week":
        startDate = startOfDay(now);
        endDate = addDays(startOfDay(now), 7);
        break;
      case "month":
        startDate = startOfDay(now);
        endDate = addDays(startOfDay(now), 30);
        break;
      case "quarter":
        startDate = startOfDay(now);
        endDate = addDays(startOfDay(now), 90);
        break;
      default:
        startDate = startOfDay(now);
        endDate = addDays(startOfDay(now), 7);
    }

    // Get events for the timeframe
    const events = await prisma.calendarEvent.findMany({
      where: {
        userId,
        start: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { start: 'asc' }
    });

    // Analyze spending patterns
    const spendingAnalysis = analyzeSpendingPatterns(events, timeframe);
    
    // Generate predictions
    const predictions = generateSpendingPredictions(events, spendingAnalysis, timeframe);
    
    // Get risk assessment
    const riskAssessment = assessSpendingRisk(events, spendingAnalysis);

    return NextResponse.json({
      timeframe,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalEvents: events.length,
      spendingAnalysis,
      predictions,
      riskAssessment,
      recommendations: generateRecommendations(events, spendingAnalysis, riskAssessment)
    });
  } catch (error) {
    console.error("Spending Forecast Error:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}

function analyzeSpendingPatterns(events: any[], timeframe: string) {
  const analysis = {
    totalPredictedSpending: 0,
    highSpendingEvents: 0,
    lowSpendingEvents: 0,
    categoryBreakdown: {} as Record<string, number>,
    timeBreakdown: {
      morning: 0,
      afternoon: 0,
      evening: 0,
      weekend: 0
    },
    weeklyPattern: {} as Record<string, number>
  };

  events.forEach(event => {
    if (event.spendingProbability && event.expectedSpendingRange) {
      const avgExpected = (event.expectedSpendingRange[0] + event.expectedSpendingRange[1]) / 2;
      const predictedSpending = avgExpected * event.spendingProbability;
      
      analysis.totalPredictedSpending += predictedSpending;
      
      if (event.spendingProbability > 0.7) {
        analysis.highSpendingEvents++;
      } else {
        analysis.lowSpendingEvents++;
      }

      // Category breakdown
      const category = event.category || 'Other';
      analysis.categoryBreakdown[category] = (analysis.categoryBreakdown[category] || 0) + predictedSpending;

      // Time breakdown
      const hour = new Date(event.start).getHours();
      if (hour >= 6 && hour < 12) {
        analysis.timeBreakdown.morning += predictedSpending;
      } else if (hour >= 12 && hour < 18) {
        analysis.timeBreakdown.afternoon += predictedSpending;
      } else {
        analysis.timeBreakdown.evening += predictedSpending;
      }

      // Weekend analysis
      const day = new Date(event.start).getDay();
      if (day === 0 || day === 6) {
        analysis.timeBreakdown.weekend += predictedSpending;
      }

      // Weekly pattern
      const weekStart = format(startOfDay(new Date(event.start)), 'yyyy-MM-dd');
      analysis.weeklyPattern[weekStart] = (analysis.weeklyPattern[weekStart] || 0) + predictedSpending;
    }
  });

  return analysis;
}

function generateSpendingPredictions(events: any[], analysis: any, timeframe: string) {
  const predictions = {
    totalSpending: analysis.totalPredictedSpending,
    dailyAverage: analysis.totalPredictedSpending / (timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 90),
    weeklyAverage: analysis.totalPredictedSpending / (timeframe === 'week' ? 1 : timeframe === 'month' ? 4 : 13),
    peakSpendingDay: null as string | null,
    peakSpendingAmount: 0,
    lowSpendingDays: [] as string[],
    categoryPredictions: [] as Array<{ category: string; amount: number; percentage: number }>
  };

  // Find peak spending day
  Object.entries(analysis.weeklyPattern).forEach(([date, amount]) => {
    if (amount > predictions.peakSpendingAmount) {
      predictions.peakSpendingAmount = amount;
      predictions.peakSpendingDay = date;
    }
  });

  // Find low spending days (less than 20% of peak)
  Object.entries(analysis.weeklyPattern).forEach(([date, amount]) => {
    if (amount < predictions.peakSpendingAmount * 0.2) {
      predictions.lowSpendingDays.push(date);
    }
  });

  // Category predictions
  const totalSpending = analysis.totalPredictedSpending;
  Object.entries(analysis.categoryBreakdown).forEach(([category, amount]) => {
    predictions.categoryPredictions.push({
      category,
      amount: amount as number,
      percentage: totalSpending > 0 ? ((amount as number) / totalSpending) * 100 : 0
    });
  });

  // Sort by amount descending
  predictions.categoryPredictions.sort((a, b) => b.amount - a.amount);

  return predictions;
}

function assessSpendingRisk(events: any[], analysis: any) {
  const risk = {
    level: 'low' as 'low' | 'medium' | 'high',
    score: 0,
    factors: [] as string[],
    warnings: [] as string[]
  };

  let riskScore = 0;

  // High spending events
  if (analysis.highSpendingEvents > 5) {
    riskScore += 30;
    risk.factors.push(`High number of expensive events (${analysis.highSpendingEvents})`);
  }

  // Weekend spending
  if (analysis.timeBreakdown.weekend > analysis.totalPredictedSpending * 0.6) {
    riskScore += 20;
    risk.factors.push('High weekend spending pattern');
  }

  // Evening spending
  if (analysis.timeBreakdown.evening > analysis.totalPredictedSpending * 0.5) {
    riskScore += 15;
    risk.factors.push('High evening spending pattern');
  }

  // Total spending amount
  if (analysis.totalPredictedSpending > 1000) {
    riskScore += 25;
    risk.factors.push('High total predicted spending');
  }

  // College classes (low risk)
  const collegeClasses = events.filter(e => e.category === 'College Classes');
  if (collegeClasses.length > events.length * 0.3) {
    riskScore -= 20;
    risk.factors.push('High proportion of academic events (low spending)');
  }

  risk.score = Math.max(0, Math.min(100, riskScore));

  // Determine risk level
  if (risk.score >= 70) {
    risk.level = 'high';
    risk.warnings.push('Consider reviewing your spending plans');
    risk.warnings.push('Set aside emergency funds');
  } else if (risk.score >= 40) {
    risk.level = 'medium';
    risk.warnings.push('Monitor your spending closely');
  } else {
    risk.level = 'low';
    risk.warnings.push('Your spending looks well-managed');
  }

  return risk;
}

function generateRecommendations(events: any[], analysis: any, risk: any) {
  const recommendations = [];

  // High spending recommendations
  if (analysis.highSpendingEvents > 0) {
    recommendations.push({
      type: 'warning',
      title: 'High Spending Events Detected',
      message: `You have ${analysis.highSpendingEvents} events with high spending probability. Consider setting aside $${(analysis.totalPredictedSpending * 0.8).toFixed(2)} for these events.`,
      priority: 'high'
    });
  }

  // Weekend spending
  if (analysis.timeBreakdown.weekend > analysis.totalPredictedSpending * 0.5) {
    recommendations.push({
      type: 'info',
      title: 'Weekend Spending Pattern',
      message: `${((analysis.timeBreakdown.weekend / analysis.totalPredictedSpending) * 100).toFixed(1)}% of your spending is on weekends. Plan accordingly.`,
      priority: 'medium'
    });
  }

  // Budget recommendations
  if (analysis.totalPredictedSpending > 500) {
    recommendations.push({
      type: 'success',
      title: 'Budget Planning',
      message: `Set aside $${(analysis.totalPredictedSpending / 4).toFixed(2)} per week to cover your predicted expenses.`,
      priority: 'medium'
    });
  }

  // Low risk recommendations
  if (risk.level === 'low') {
    recommendations.push({
      type: 'success',
      title: 'Great Financial Planning!',
      message: 'Your spending patterns look well-managed. Keep up the good work!',
      priority: 'low'
    });
  }

  return recommendations;
} 
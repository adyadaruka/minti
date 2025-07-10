import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { addDays, startOfDay, endOfDay, format, isToday, isTomorrow } from 'date-fns';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId parameter" }, 
        { status: 400 }
      );
    }

    const now = new Date();
    const startDate = addDays(startOfDay(now), -30); // Last 30 days
    const endDate = addDays(startOfDay(now), 30);    // Next 30 days

    // Get events for analysis
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

    // Calculate insights
    const insights = {
      totalEvents: events.length,
      upcomingEvents: events.filter(e => new Date(e.start) > now).length,
      todayEvents: events.filter(e => isToday(new Date(e.start))).length,
      tomorrowEvents: events.filter(e => isTomorrow(new Date(e.start))).length,
      
      // Category breakdown
      categories: events.reduce((acc, event) => {
        const category = event.category || 'Other';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),

      // Spending predictions
      spendingPredictions: {
        totalPredictedSpending: events.reduce((sum, event) => {
          if (event.spendingProbability && event.expectedSpendingRange) {
            const avgExpected = (event.expectedSpendingRange[0] + event.expectedSpendingRange[1]) / 2;
            return sum + (avgExpected * event.spendingProbability);
          }
          return sum;
        }, 0),
        
        highSpendingEvents: events.filter(e => e.spendingProbability && e.spendingProbability > 0.7).length,
        
        weeklyBreakdown: getWeeklySpendingBreakdown(events),
        
        topSpendingCategories: getTopSpendingCategories(events)
      },

      // Time analysis
      timeAnalysis: {
        morningEvents: events.filter(e => {
          const hour = new Date(e.start).getHours();
          return hour >= 6 && hour < 12;
        }).length,
        
        afternoonEvents: events.filter(e => {
          const hour = new Date(e.start).getHours();
          return hour >= 12 && hour < 18;
        }).length,
        
        eveningEvents: events.filter(e => {
          const hour = new Date(e.start).getHours();
          return hour >= 18 || hour < 6;
        }).length,
        
        weekendEvents: events.filter(e => {
          const day = new Date(e.start).getDay();
          return day === 0 || day === 6;
        }).length
      },

      // Recommendations
      recommendations: generateRecommendations(events)
    };

    return NextResponse.json(insights);
  } catch (error) {
    console.error("Analytics Error:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}

function getWeeklySpendingBreakdown(events: any[]) {
  const weeks: Record<string, number> = {};
  
  events.forEach(event => {
    if (event.spendingProbability && event.expectedSpendingRange) {
      const weekStart = format(startOfDay(new Date(event.start)), 'yyyy-MM-dd');
      const avgExpected = (event.expectedSpendingRange[0] + event.expectedSpendingRange[1]) / 2;
      const predictedSpending = avgExpected * event.spendingProbability;
      
      weeks[weekStart] = (weeks[weekStart] || 0) + predictedSpending;
    }
  });
  
  return weeks;
}

function getTopSpendingCategories(events: any[]) {
  const categories: Record<string, number> = {};
  
  events.forEach(event => {
    if (event.spendingProbability && event.expectedSpendingRange) {
      const category = event.category || 'Other';
      const avgExpected = (event.expectedSpendingRange[0] + event.expectedSpendingRange[1]) / 2;
      const predictedSpending = avgExpected * event.spendingProbability;
      
      categories[category] = (categories[category] || 0) + predictedSpending;
    }
  });
  
  return Object.entries(categories)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([category, amount]) => ({ category, amount }));
}

function generateRecommendations(events: any[]) {
  const recommendations = [];
  
  // High spending events warning
  const highSpendingEvents = events.filter(e => e.spendingProbability && e.spendingProbability > 0.8);
  if (highSpendingEvents.length > 0) {
    recommendations.push({
      type: 'warning',
      title: 'High Spending Events Ahead',
      message: `You have ${highSpendingEvents.length} events with high spending probability. Consider setting aside budget.`,
      events: highSpendingEvents.slice(0, 3).map(e => ({ title: e.title, date: e.start }))
    });
  }
  
  // Weekend events
  const weekendEvents = events.filter(e => {
    const day = new Date(e.start).getDay();
    return day === 0 || day === 6;
  });
  
  if (weekendEvents.length > 5) {
    recommendations.push({
      type: 'info',
      title: 'Busy Weekends',
      message: `You have ${weekendEvents.length} weekend events. Plan your budget accordingly.`,
      events: weekendEvents.slice(0, 3).map(e => ({ title: e.title, date: e.start }))
    });
  }
  
  // College classes reminder
  const collegeClasses = events.filter(e => e.category === 'College Classes');
  if (collegeClasses.length > 0) {
    recommendations.push({
      type: 'success',
      title: 'Academic Schedule',
      message: `You have ${collegeClasses.length} academic events. Low spending expected.`,
      events: collegeClasses.slice(0, 3).map(e => ({ title: e.title, date: e.start }))
    });
  }
  
  return recommendations;
} 
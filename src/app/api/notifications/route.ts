import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { addDays, startOfDay, isToday, isTomorrow } from 'date-fns';

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
    const startDate = now;
    const endDate = addDays(startOfDay(now), 7); // Next 7 days

    // Get upcoming events
    const upcomingEvents = await prisma.calendarEvent.findMany({
      where: {
        userId,
        start: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { start: 'asc' }
    });

    // Generate notifications
    const notifications = [];

    // Today's events
    const todayEvents = upcomingEvents.filter(e => isToday(new Date(e.start)));
    if (todayEvents.length > 0) {
      notifications.push({
        id: 'today-events',
        type: 'info',
        title: `You have ${todayEvents.length} event${todayEvents.length > 1 ? 's' : ''} today`,
        message: todayEvents.map(e => e.title).join(', '),
        priority: 'high',
        timestamp: now.toISOString()
      });
    }

    // Tomorrow's events
    const tomorrowEvents = upcomingEvents.filter(e => isTomorrow(new Date(e.start)));
    if (tomorrowEvents.length > 0) {
      notifications.push({
        id: 'tomorrow-events',
        type: 'info',
        title: `You have ${tomorrowEvents.length} event${tomorrowEvents.length > 1 ? 's' : ''} tomorrow`,
        message: tomorrowEvents.map(e => e.title).join(', '),
        priority: 'medium',
        timestamp: now.toISOString()
      });
    }

    // High spending events
    const highSpendingEvents = upcomingEvents.filter(e => 
      e.spendingProbability && e.spendingProbability > 0.8
    );
    
    if (highSpendingEvents.length > 0) {
      const totalPredicted = highSpendingEvents.reduce((sum, event) => {
        if (event.expectedSpendingRange) {
          const avgExpected = (event.expectedSpendingRange[0] + event.expectedSpendingRange[1]) / 2;
          return sum + (avgExpected * (event.spendingProbability || 0));
        }
        return sum;
      }, 0);

      notifications.push({
        id: 'high-spending',
        type: 'warning',
        title: 'High Spending Events Ahead',
        message: `You have ${highSpendingEvents.length} events with high spending probability. Total predicted: $${totalPredicted.toFixed(2)}`,
        priority: 'high',
        timestamp: now.toISOString()
      });
    }

    // Weekend events
    const weekendEvents = upcomingEvents.filter(e => {
      const day = new Date(e.start).getDay();
      return day === 0 || day === 6;
    });

    if (weekendEvents.length > 3) {
      notifications.push({
        id: 'weekend-events',
        type: 'info',
        title: 'Busy Weekend Ahead',
        message: `You have ${weekendEvents.length} weekend events. Plan your budget accordingly.`,
        priority: 'medium',
        timestamp: now.toISOString()
      });
    }

    // College classes reminder
    const collegeClasses = upcomingEvents.filter(e => e.category === 'College Classes');
    if (collegeClasses.length > 0) {
      notifications.push({
        id: 'college-classes',
        type: 'success',
        title: 'Academic Schedule',
        message: `You have ${collegeClasses.length} academic events this week. Low spending expected.`,
        priority: 'low',
        timestamp: now.toISOString()
      });
    }

    // Budget alerts (if you have budget goals)
    const budgetGoals = await prisma.budgetGoal.findMany({
      where: { userId, isActive: true }
    });

    if (budgetGoals.length > 0) {
      const totalTarget = budgetGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
      const totalCurrent = budgetGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
      const progress = (totalCurrent / totalTarget) * 100;

      if (progress > 80) {
        notifications.push({
          id: 'budget-progress',
          type: 'success',
          title: 'Great Budget Progress!',
          message: `You're ${progress.toFixed(1)}% towards your budget goals. Keep it up!`,
          priority: 'medium',
          timestamp: now.toISOString()
        });
      }
    }

    return NextResponse.json({
      notifications: notifications.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
      }),
      count: notifications.length
    });
  } catch (error) {
    console.error("Notifications Error:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
} 
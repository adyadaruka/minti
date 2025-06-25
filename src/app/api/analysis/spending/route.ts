import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { SpendingAnalysis, EventSpendingCorrelation } from "@/types";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const days = parseInt(searchParams.get("days") || "30");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId parameter" },
        { status: 400 }
      );
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all events in the time range
    const events = await prisma.calendarEvent.findMany({
      where: {
        userId,
        start: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        transactions: true,
      },
      orderBy: { start: 'asc' },
    });

    // Get all transactions in the time range
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        type: 'EXPENSE',
      },
      include: {
        event: true,
      },
      orderBy: { date: 'desc' },
    });

    // Analyze spending patterns
    const analysis: SpendingAnalysis = {
      totalSpent: 0,
      totalIncome: 0,
      eventTriggeredSpending: 0,
      eventTriggeredTransactions: [],
      categoryBreakdown: {},
      timeBasedAnalysis: {
        dayOfWeekSpending: {},
        totalDays: days,
        averageDailySpending: 0,
      },
      eventSpendingCorrelation: [],
    };

    // Calculate totals
    transactions.forEach(transaction => {
      if (transaction.type === 'EXPENSE') {
        analysis.totalSpent += transaction.amount;
        
        // Check if transaction is linked to an event
        if (transaction.eventId) {
          analysis.eventTriggeredSpending += transaction.amount;
          // Convert null category and eventId to expected types
          const transactionWithFixedFields = {
            ...transaction,
            category: transaction.category || undefined,
            eventId: transaction.eventId || undefined,
          };
          analysis.eventTriggeredTransactions.push(transactionWithFixedFields);
        }

        // Category breakdown
        const category = transaction.category || 'Uncategorized';
        if (!analysis.categoryBreakdown[category]) {
          analysis.categoryBreakdown[category] = 0;
        }
        analysis.categoryBreakdown[category] += transaction.amount;
      } else if (transaction.type === 'INCOME') {
        analysis.totalIncome += transaction.amount;
      }
    });

    // Time-based analysis (spending around events)
    events.forEach(event => {
      const eventDate = new Date(event.start);
      const eventStart = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours before
      const eventEnd = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000); // 24 hours after

      const relatedTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= eventStart && transactionDate <= eventEnd;
      });

      if (relatedTransactions.length > 0) {
        const totalSpent = relatedTransactions.reduce((sum, t) => sum + t.amount, 0);
        const correlation: EventSpendingCorrelation = {
          event: {
            id: event.id,
            title: event.title,
            start: event.start,
            category: (event.category && typeof event.category === 'string' ? event.category : 'Other') as any,
          },
          transactions: relatedTransactions.map(t => ({
            ...t,
            category: t.category || undefined,
            eventId: t.eventId || undefined,
          })),
          totalSpent,
          transactionCount: relatedTransactions.length,
        };
        analysis.eventSpendingCorrelation.push(correlation);
      }
    });

    // Calculate spending by day of week
    const dayOfWeekSpending: Record<string, number> = {};
    transactions.forEach(transaction => {
      const day = new Date(transaction.date).toLocaleDateString('en-US', { weekday: 'long' });
      if (!dayOfWeekSpending[day]) {
        dayOfWeekSpending[day] = 0;
      }
      dayOfWeekSpending[day] += transaction.amount;
    });

    analysis.timeBasedAnalysis = {
      dayOfWeekSpending,
      totalDays: days,
      averageDailySpending: analysis.totalSpent / days,
    };

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Spending Analysis API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
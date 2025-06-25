import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

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

    const billReminders = await prisma.billReminder.findMany({
      where: { userId },
      orderBy: { dueDate: 'asc' },
    });

    return NextResponse.json(billReminders);
  } catch (error) {
    console.error("Bill Reminders API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, name, amount, dueDate, category, reminderDays, isRecurring, frequency } = body;

    if (!userId || !name || !amount || !dueDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const billReminder = await prisma.billReminder.create({
      data: {
        userId,
        name,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        category,
        reminderDays: reminderDays || 3,
        isRecurring: isRecurring || false,
        frequency: frequency ? frequency.toUpperCase() : null,
      },
    });

    return NextResponse.json(billReminder);
  } catch (error) {
    console.error("Bill Reminders API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
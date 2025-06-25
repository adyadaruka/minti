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

    const recurringTransactions = await prisma.recurringTransaction.findMany({
      where: { userId },
      include: {
        transactions: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(recurringTransactions);
  } catch (error) {
    console.error("Recurring Transactions API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, description, amount, category, type, frequency, startDate, endDate } = body;

    if (!userId || !description || !amount || !type || !frequency || !startDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const recurringTransaction = await prisma.recurringTransaction.create({
      data: {
        userId,
        description,
        amount: parseFloat(amount),
        category,
        type: type.toUpperCase(),
        frequency: frequency.toUpperCase(),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    return NextResponse.json(recurringTransaction);
  } catch (error) {
    console.error("Recurring Transactions API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
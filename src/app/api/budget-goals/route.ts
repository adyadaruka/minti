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

    const budgetGoals = await prisma.budgetGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(budgetGoals);
  } catch (error) {
    console.error("Budget Goals API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, name, targetAmount, deadline, category, color, icon } = body;

    if (!userId || !name || !targetAmount || !color) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const budgetGoal = await prisma.budgetGoal.create({
      data: {
        userId,
        name,
        targetAmount: parseFloat(targetAmount),
        deadline: deadline ? new Date(deadline) : null,
        category,
        color,
        icon,
      },
    });

    return NextResponse.json(budgetGoal);
  } catch (error) {
    console.error("Budget Goals API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
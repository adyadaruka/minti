import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { isPaid } = body;

    if (typeof isPaid !== 'boolean') {
      return NextResponse.json(
        { error: "isPaid must be a boolean" },
        { status: 400 }
      );
    }

    const updatedBill = await prisma.billReminder.update({
      where: { id },
      data: { isPaid },
    });

    return NextResponse.json(updatedBill);
  } catch (error) {
    console.error("Bill Reminder Update API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { addDays, startOfDay } from 'date-fns';

const prisma = new PrismaClient();

// Input validation
function validateEvent(event: any) {
  return event && 
         typeof event.id === 'string' && 
         typeof event.title === 'string' &&
         event.start && 
         event.end;
}

function validateUser(user: any) {
  return user && 
         typeof user.email === 'string' && 
         (user.id || user.sub);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user, events } = body;

    console.log(`Processing ${events.length} events for user ${user.email}`);

    // Validate input
    if (!validateUser(user)) {
      return NextResponse.json(
        { error: "Invalid user data" }, 
        { status: 400 }
      );
    }

    if (!Array.isArray(events)) {
      return NextResponse.json(
        { error: "Events must be an array" }, 
        { status: 400 }
      );
    }

    // Validate each event
    for (const event of events) {
      if (!validateEvent(event)) {
        return NextResponse.json(
          { error: "Invalid event data" }, 
          { status: 400 }
        );
      }
    }

    // Upsert user
    const userId = user.sub || user.id;
    await prisma.user.upsert({
      where: { email: user.email },
      update: { 
        name: user.name || user.email,
        id: userId 
      },
      create: { 
        id: userId, 
        email: user.email, 
        name: user.name || user.email 
      },
    });

    // Get existing events count before deletion
    const existingCount = await prisma.calendarEvent.count({
      where: { userId }
    });
    console.log(`Found ${existingCount} existing events for user`);

    // First, delete all existing events for this user to ensure clean sync
    await prisma.calendarEvent.deleteMany({
      where: { userId }
    });
    console.log(`Deleted ${existingCount} existing events`);

    // Remove duplicates from the incoming events array
    const uniqueEvents = events.filter((event: any, index: number, self: any[]) => 
      index === self.findIndex((e: any) => e.id === event.id)
    );
    console.log(`After deduplication: ${uniqueEvents.length} unique events`);

    // Save events for user (now they will be unique since we cleared existing ones)
    const savedEvents = [];
    for (const event of uniqueEvents) {
      try {
        const savedEvent = await prisma.calendarEvent.create({
          data: { 
            id: event.id,
            userId: userId,
            title: event.title,
            description: event.description,
            start: new Date(event.start),
            end: new Date(event.end),
            category: event.category,
            raw: event.raw,
          },
        });
        savedEvents.push(savedEvent);
      } catch (error) {
        console.error(`Failed to save event ${event.id}:`, error);
        // Continue with other events
      }
    }

    console.log(`Successfully saved ${savedEvents.length} events`);

    return NextResponse.json({ 
      success: true, 
      savedCount: savedEvents.length,
      totalCount: uniqueEvents.length,
      originalCount: events.length
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}

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

    // Calculate date range: 4 weeks in the past, 2 weeks in the future
    const now = new Date();
    const startDate = addDays(startOfDay(now), -28); // 4 weeks ago
    const endDate = addDays(startOfDay(now), 14);    // 2 weeks in the future

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
    
    console.log(`Retrieved ${events.length} events for user ${userId}`);
    
    return NextResponse.json(events);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
} 
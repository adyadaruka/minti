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
    console.log('User data:', { id: user.id, email: user.email, name: user.name });

    // Validate input
    if (!validateUser(user)) {
      console.error('Invalid user data:', user);
      return NextResponse.json(
        { error: "Invalid user data" }, 
        { status: 400 }
      );
    }

    if (!Array.isArray(events)) {
      console.error('Events is not an array:', typeof events);
      return NextResponse.json(
        { error: "Events must be an array" }, 
        { status: 400 }
      );
    }

    // Validate each event
    for (const event of events) {
      if (!validateEvent(event)) {
        console.error('Invalid event data:', event);
        return NextResponse.json(
          { error: "Invalid event data" }, 
          { status: 400 }
        );
      }
    }

    // Upsert user
    const userId = user.sub || user.id;
    console.log('Upserting user with ID:', userId);
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
    console.log('User upserted successfully');

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
        console.log('Saving event:', event.id, event.title);
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
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const upcoming = searchParams.get("upcoming");
    const highSpending = searchParams.get("highSpending");
    
    console.log('GET /api/events called with userId:', userId);
    console.log('Filters:', { category, search, upcoming, highSpending });
    
    if (!userId) {
      console.error('Missing userId parameter');
      return NextResponse.json(
        { error: "Missing userId parameter" }, 
        { status: 400 }
      );
    }

    // Build where clause
    let whereClause: any = { userId };

    // Date range: 1 year in the past, 2 years in the future
    const now = new Date();
    const startDate = addDays(startOfDay(now), -365); // 1 year ago
    const endDate = addDays(startOfDay(now), 730);    // 2 years in the future

    whereClause.start = {
      gte: startDate,
      lte: endDate
    };

    // Category filter
    if (category && category !== 'all') {
      whereClause.category = category;
    }

    // Search filter
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Upcoming events only
    if (upcoming === 'true') {
      whereClause.start = {
        ...whereClause.start,
        gte: now
      };
    }

    // High spending probability events
    if (highSpending === 'true') {
      whereClause.spendingProbability = {
        gte: 0.7
      };
    }

    console.log('Where clause:', JSON.stringify(whereClause, null, 2));

    const events = await prisma.calendarEvent.findMany({ 
      where: whereClause,
      orderBy: { start: 'asc' }
    });
    
    console.log(`Retrieved ${events.length} events for user ${userId}`);
    console.log('Sample events:', events.slice(0, 3).map(e => ({ id: e.id, title: e.title, start: e.start })));
    
    return NextResponse.json(events);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
} 
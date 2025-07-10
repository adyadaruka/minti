import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const accessToken = searchParams.get("access_token");
    
    if (!accessToken) {
      return NextResponse.json(
        { error: "Missing access_token parameter" }, 
        { status: 400 }
      );
    }

    console.log('Testing Google Calendar API with token length:', accessToken.length);

    // Test Google Calendar API
    const timeMin = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(); // Last 7 days
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10&singleEvents=true&orderBy=startTime&timeMin=${timeMin}`;
    
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    console.log('Google API response status:', res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Google API error response:', errorText);
      return NextResponse.json(
        { error: `Google API error: ${res.status} ${res.statusText}`, details: errorText },
        { status: res.status }
      );
    }
    
    const data = await res.json();
    console.log('Google API response data:', data);
    
    return NextResponse.json({
      success: true,
      eventsCount: data.items?.length || 0,
      sampleEvents: data.items?.slice(0, 3) || [],
      calendarId: data.items?.[0]?.organizer?.email || 'No events found'
    });
  } catch (error) {
    console.error("Test API Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
} 
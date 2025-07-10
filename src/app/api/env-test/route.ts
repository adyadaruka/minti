import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const envInfo = {
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'Set' : 'Not set',
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
    };
    
    return NextResponse.json({
      success: true,
      environment: envInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Env test error:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
} 
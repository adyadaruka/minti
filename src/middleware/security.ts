import { NextRequest, NextResponse } from 'next/server';

// Example: Require authentication (customize as needed)
export function requireAuth(req: NextRequest) {
  // Example: Check for a session or token (customize for your app)
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Optionally, verify the token here
  return null; // null means authorized
}

// Example: Input validation helper
export function validateInput(input: any, schema: any) {
  // Use a schema validation library like zod or yup in real apps
  // This is a placeholder
  if (!input) {
    return false;
  }
  return true;
}

// Example: Set secure headers
export function setSecureHeaders(res: NextResponse) {
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Content-Security-Policy', "default-src 'self'; img-src 'self' data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';");
  return res;
} 
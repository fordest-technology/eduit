import { NextResponse } from "next/server";

export async function GET() {
  // Always return a valid session for development
  return NextResponse.json({
    user: {
      id: "1",
      name: "Test User",
      email: "test@example.com",
      role: "ADMIN",
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
  });
}

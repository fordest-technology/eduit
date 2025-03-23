import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Get the session cookie
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get("session");

    // Check if we have a cookie
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        {
          error: "No session cookie found",
          cookie_exists: false,
          cookies_available: cookieStore.getAll().map((c) => c.name),
        },
        { status: 200 }
      );
    }

    // Try to verify the JWT
    const payload = await verifyJwt(sessionCookie.value);

    if (!payload) {
      return NextResponse.json(
        {
          error: "Invalid or expired session token",
          cookie_exists: true,
          cookie_value_length: sessionCookie.value.length,
          token_valid: false,
        },
        { status: 200 }
      );
    }

    // Return session info (safe version)
    return NextResponse.json(
      {
        message: "Valid session found",
        cookie_exists: true,
        token_valid: true,
        session_info: {
          id: payload.id,
          email: payload.email,
          name: payload.name,
          role: payload.role,
          schoolId: payload.schoolId,
          exp: payload.exp,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Session debug error:", error);
    return NextResponse.json(
      {
        error: "Error checking session",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
